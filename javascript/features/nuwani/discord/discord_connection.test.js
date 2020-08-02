// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { BackoffPolicy } from 'features/nuwani/runtime/backoff_policy.js';
import { DiscordConnection } from 'features/nuwani/discord/discord_connection.js';
import { MockSocket } from 'features/nuwani/discord/mock_socket.js';

describe('DiscordConnection', (it, beforeEach, afterEach) => {
    let connection = null;
    let socket = null;

    beforeEach(() => {
        connection = new DiscordConnection({
            clientId: '12345678',
            clientSecret: 'my-super-secret-password',
            endpoint: 'wss://gateway.discord.gg/?v=6&encoding=json',
            token: 'my-super-secret-token',
        });

        socket = MockSocket.getMostRecentInstance();
    });

    afterEach(() => connection.dispose());

    it('should be able to establish and maintain a connection with Discord', async (assert) => {
        assert.isFalse(connection.isConnected());

        // (1) Connect to the Discord server, with immediate success. This will automatically run
        // the authentication flow as well (2 IDENTIFY message).
        await Promise.all([
            connection.connect(),
            server.clock.advance(BackoffPolicy.CalculateDelayForAttempt(0)),
        ]);

        assert.isTrue(connection.isConnected());
        assert.isTrue(connection.isAuthenticated());
        assert.isNull(connection.hearbeatAckTimeForTesting);

        // (2) Make sure that the client heartbeat is sent to the Discord server at the configured
        // cadance, indicated by the server in the 10 HELLO message.
        for (let cycle = 0; cycle < 5; ++cycle) {
            await server.clock.advance(MockSocket.getHeartbeatIntervalMs());
            await Promise.resolve();

            assert.closeTo(
                connection.hearbeatAckTimeForTesting,
                server.clock.monotonicallyIncreasingTime(), 5);
        }

        // (3) Disconnect manually from the Discord server, and confirm that the connection state
        // changes. In reality this is a networking-slow asynchronous operation.
        await connection.disconnect();

        assert.isFalse(connection.isConnected());
        assert.isFalse(connection.isAuthenticated());
    });

    it('should trigger a reconnection with the server on 7 RECONNECT messages', async (assert) => {
        assert.isFalse(connection.isConnected());

        // (1) Connect to the Discord server, with immediate success.
        await Promise.all([
            connection.connect(),
            server.clock.advance(BackoffPolicy.CalculateDelayForAttempt(0)),
        ]);

        assert.isTrue(connection.isConnected());
        assert.isTrue(connection.isAuthenticated());

        // (2) Send a 7 RECONNECT message over the |socket|, which should trigger the connection to
        // issue a reconnection. Store the current socket's connection Id first.
        const originalConnectionId = socket.connectionId;

        await socket.sendDelayedOpcodeMessage(1, {
            op: MockSocket.kOpcodeReconnect,
        });

        assert.isFalse(connection.isConnected());
        assert.isFalse(connection.isAuthenticated());

        // (3) Wait for the normal connection back-off. After that we expect to be connected again,
        // and the entire handshake & identification path should execute again.
        await server.clock.advance(BackoffPolicy.CalculateDelayForAttempt(0));
        await Promise.resolve();  // allow authentication to pass
        await Promise.resolve();  // ^^^

        assert.isTrue(connection.isConnected());
        assert.isTrue(connection.isAuthenticated());

        assert.notEqual(socket.connectionId, originalConnectionId);
    });

    it('should shut itself down after the second 9 INVALID SESSION message', async (assert) => {
        assert.isFalse(connection.isConnected());

        // (1) Connect to the Discord server, with immediate success.
        await Promise.all([
            connection.connect(),
            server.clock.advance(BackoffPolicy.CalculateDelayForAttempt(0)),
        ]);

        assert.isTrue(connection.isConnected());
        assert.isTrue(connection.isAuthenticated());

        // (2) Issue a 9 INVALID SESSION message. Since this is the first one, we should simply
        // reconnect to the Discord server and try again, it might be some random issue.
        await socket.sendDelayedOpcodeMessage(1, {
            op: MockSocket.kOpcodeInvalidSession,
            d: false,
        });

        assert.isFalse(connection.isConnected());

        await server.clock.advance(BackoffPolicy.CalculateDelayForAttempt(0));

        assert.isTrue(connection.isConnected());  // <-- reconnected

        // (3) Issue a second INVALID SESSION message. This is the (current) limit, after this we
        // disconnect from Discord until a Management member starts us up again.
        await socket.sendDelayedOpcodeMessage(1, {
            op: MockSocket.kOpcodeInvalidSession,
            d: false,
        });

        assert.isFalse(connection.isConnected());

        await server.clock.advance(BackoffPolicy.CalculateDelayForAttempt(0));

        assert.isFalse(connection.isConnected());  // <-- disconnected
    });

    it('should resume the session when connection is lost', async (assert) => {
        assert.isFalse(connection.isConnected());

        // (1) Connect to the Discord server, with immediate success.
        await Promise.all([
            connection.connect(),
            server.clock.advance(BackoffPolicy.CalculateDelayForAttempt(0)),
        ]);

        assert.isFalse(socket.wasResumption);
        assert.isTrue(connection.isConnected());
        assert.isTrue(connection.isAuthenticated());

        // (2) Disconnect the socket manually. This will be an arbitrary disconnection of which the
        // DiscordConnection is not aware, so a reconnection should start automatically.
        socket.close();

        assert.isFalse(connection.isConnected());
        assert.isFalse(connection.isAuthenticated());

        // (3) Wait for the reconnection delay, then for the authentication to succeed. This should
        // be session based rather than be based on a new token.
        await server.clock.advance(BackoffPolicy.CalculateDelayForAttempt(0));
        await Promise.resolve();  // allow authentication to pass
        await Promise.resolve();  // ^^^

        assert.isTrue(socket.wasResumption);
        assert.isTrue(connection.isConnected());
        assert.isTrue(connection.isAuthenticated());
    });
});
