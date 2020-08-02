// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { BackoffPolicy } from 'features/nuwani/runtime/backoff_policy.js';
import { DiscordSocket } from 'features/nuwani/discord/discord_socket.js';
import { MockSocket } from 'features/nuwani/discord/mock_socket.js';

describe('DiscordSocket', (it, beforeEach) => {
    let discord = null;
    let socket = null;

    beforeEach(() => {
        discord = new DiscordSocket();
        socket = MockSocket.getMostRecentInstance();
    });

    // Endpoint that we'll pretend to use for testing purposes.
    const kDiscordEndpoint = 'wss://gateway.discord.gg/?v=6&encoding=json';

    it('should be able to establish a connection to Discord', async (assert) => {
        assert.equal(discord.state, DiscordSocket.kStateDisconnected);

        await Promise.all([
            discord.connect(kDiscordEndpoint),
            server.clock.advance(BackoffPolicy.CalculateDelayForAttempt(0)),
        ]);

        assert.equal(discord.state, DiscordSocket.kStateConnected);

        await discord.disconnect();

        assert.equal(discord.state, DiscordSocket.kStateDisconnected);
    });

    it('should apply the backoff policy when connection issues are seen', async (assert) => {
        assert.equal(discord.state, DiscordSocket.kStateDisconnected);

        socket.enableBehaviour(MockSocket.kBehaviourFailFirstConnection);

        const connectionPromise = discord.connect(kDiscordEndpoint);

        // (1) The initial delay must be applied, so the state should still be disconnected.
        assert.equal(discord.state, DiscordSocket.kStateDisconnected);

        await server.clock.advance(BackoffPolicy.CalculateDelayForAttempt(0));
        await Promise.resolve();

        // (2) The first delay passed, the first attempt has passed, and failed.
        assert.equal(discord.state, DiscordSocket.kStateDisconnected);

        await server.clock.advance(BackoffPolicy.CalculateDelayForAttempt(1));
        await Promise.resolve();

        // (3) The second attempt has now gone through, and succeeded.
        assert.equal(discord.state, DiscordSocket.kStateConnected);

        await connectionPromise;

        // Disconnect the socket, to make sure that's reflected as well.
        await discord.disconnect();

        assert.equal(discord.state, DiscordSocket.kStateDisconnected);
    });
});
