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

    it('should be able to establish connection with Discord', async (assert) => {
        assert.isFalse(connection.isConnected());

        await Promise.all([
            connection.connect(),
            server.clock.advance(BackoffPolicy.CalculateDelayForAttempt(0)),
        ]);

        assert.isTrue(connection.isConnected());

        await connection.disconnect();

        assert.isFalse(connection.isConnected());
    });
});
