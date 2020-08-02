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

    });

    it('should shut itself down after the second 9 INVALID SESSION message', async (assert) => {

    });
});
