// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { BackoffPolicy } from 'features/nuwani/runtime/backoff_policy.js';
import { Connection } from 'features/nuwani/runtime/connection.js';

import { TestServerSocket } from 'features/nuwani/test/test_server_socket.js';

describe('Connection', (it, beforeEach, afterEach) => {
    let network = null;

    beforeEach(() => network = new TestServerSocket());
    afterEach(() => {
        network.dispose();
        network = null;
    });

    it('should be able to establish a connection', async (assert) => {
        let connectionSuccessful = false;

        // Test flow:
        //   1. Connection.connect() waits for the initial delay to pass,
        //   2. server.clock.advance() makes it pass instantly, to not pause the test,
        //   3. A connection is opened to 127.0.0.1, which passes.

        const servers = [{ ip: '127.0.0.1', port: 6667 }];
        const connection = new Connection(servers, new class {
            onConnectionFailed() {}
            onConnectionEstablished() {
                connectionSuccessful = true;
            }
            onConnectionMessage(message) {}
            onConnectionClosed() {}
        });

        await Promise.all([
            connection.connect(),
            server.clock.advance(BackoffPolicy.CalculateDelayForAttempt(0)),
        ]);

        assert.isTrue(connectionSuccessful);

        assert.equal(network.sockets.length, 1);
        assert.equal(network.sockets[0].ipForTesting, '127.0.0.1');
        assert.equal(network.sockets[0].portForTesting, 6667);
    });

    it('should be able to fall back to another server when connectivity fails', async (assert) => {
        let connectionFailed = false;
        let connectionSuccessful = false;

        // Test flow:
        //   1. Connection.connect() waits for the initial delay to pass,
        //   2. server.clock.advance() makes it pass instantly, to not pause the test,
        //   3. A connection is opened to 127.0.0.1, it fails. onConnectionFailed() is called,
        //   4. Connection.connect() waits for the back-off delay to pass,
        //   5. server.clock.advance() makes it pass instantly, in a microtask for call ordering,
        //   6. A connection is opened to 127.0.0.2, which passes instead.

        const servers = [
            { ip: '127.0.0.1', port: TestServerSocket.kFailurePort },
            { ip: '127.0.0.2', port: 6667 },
        ];

        const connection = new Connection(servers, new class {
            onConnectionFailed() {
                connectionFailed = true;
                Promise.resolve().then(
                    () => server.clock.advance(BackoffPolicy.CalculateDelayForAttempt(1)));
            }
            onConnectionEstablished() {
                connectionSuccessful = true;
            }
            onConnectionMessage(message) {}
            onConnectionClosed() {}
        });

        await Promise.all([
            connection.connect(),
            server.clock.advance(BackoffPolicy.CalculateDelayForAttempt(0)),
        ]);

        assert.isTrue(connectionFailed);
        assert.isTrue(connectionSuccessful);

        assert.equal(network.sockets.length, 1);
        assert.equal(network.sockets[0].ipForTesting, '127.0.0.2');
        assert.equal(network.sockets[0].portForTesting, 6667);
    });

    it('should abort connection attempts if the Connection class gets disposed', async (assert) => {
        let connectionFailed = false;
        let connectionSuccessful = false;

        // Test flow:
        //   1. Connection.connect() waits for the initial delay to pass,
        //   2. Meanwhile, the Connection class gets disposed of.
        //   3. The delay finished, Connection notices that it got disposed of, bails out.

        const servers = [{ ip: '127.0.0.1', port: 6667 }];
        const connection = new Connection(servers, new class {
            onConnectionFailed() {
                connectionFailed = true;
            }
            onConnectionEstablished() {
                connectionSuccessful = true;
            }
            onConnectionMessage(message) {}
            onConnectionClosed() {}
        });

        connection.connect();
        connection.dispose();

        await server.clock.advance(BackoffPolicy.CalculateDelayForAttempt(0));

        assert.isFalse(connectionSuccessful);
        assert.isFalse(connectionFailed);
    });

    // TODO: Test UTF-8 encoding and decoding behaviour of the Connection class
});
