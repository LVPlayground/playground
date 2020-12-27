// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { BackoffPolicy } from 'features/nuwani/runtime/backoff_policy.js';
import { DiscordSocket, kInitialBackoffDelayMs } from 'features/nuwani_discord/discord_socket.js';
import { MockSocket } from 'features/nuwani_discord/mock_socket.js';

import { stringToUtf8Buffer } from 'components/networking/utf-8.js';

describe('DiscordSocket', (it, beforeEach, afterEach) => {
    let connectionClosedCalls = 0;
    let connectionEstablishedCalls = 0;
    let connectionFailedCalls = 0;
    let messageData = null;

    let discord = null;
    let socket = null;

    beforeEach(() => {
        connectionClosedCalls = 0;
        connectionEstablishedCalls = 0;
        connectionFailedCalls = 0;
        messageData = null;

        discord = new DiscordSocket(new class {
            onConnectionClosed() { ++connectionClosedCalls; }
            onConnectionEstablished() { ++connectionEstablishedCalls; }
            onConnectionFailed() { ++connectionFailedCalls; }
            onMessage(message) { messageData = message; }
        });

        socket = MockSocket.getMostRecentInstance();
    });

    afterEach(() => discord.dispose());

    // Endpoint that we'll pretend to use for testing purposes.
    const kDiscordEndpoint = 'wss://gateway.discord.gg/?v=6&encoding=json';

    it('should be able to establish a connection to Discord', async (assert) => {
        assert.equal(discord.state, DiscordSocket.kStateDisconnected);
        assert.equal(connectionEstablishedCalls, 0);
        assert.equal(connectionFailedCalls, 0);

        await Promise.all([
            discord.connect(kDiscordEndpoint),
            server.clock.advance(BackoffPolicy.CalculateDelayForAttempt(0, kInitialBackoffDelayMs)),
        ]);

        assert.equal(discord.state, DiscordSocket.kStateConnected);
        assert.equal(connectionEstablishedCalls, 1);
        assert.equal(connectionFailedCalls, 0);

        await discord.disconnect();

        assert.equal(discord.state, DiscordSocket.kStateDisconnected);
        assert.equal(connectionClosedCalls, 1);
    });

    it('should apply the backoff policy when connection issues are seen', async (assert) => {
        assert.equal(discord.state, DiscordSocket.kStateDisconnected);

        socket.enableBehaviour(MockSocket.kBehaviourFailFirstConnection);

        const connectionPromise = discord.connect(kDiscordEndpoint);

        // (1) The initial delay must be applied, so the state should still be disconnected.
        assert.equal(discord.state, DiscordSocket.kStateDisconnected);
        assert.equal(connectionEstablishedCalls, 0);
        assert.equal(connectionFailedCalls, 0);

        await server.clock.advance(
            BackoffPolicy.CalculateDelayForAttempt(0, kInitialBackoffDelayMs));
        await Promise.resolve();

        // (2) The first delay passed, the first attempt has passed, and failed.
        assert.equal(discord.state, DiscordSocket.kStateDisconnected);
        assert.equal(connectionEstablishedCalls, 0);
        assert.equal(connectionFailedCalls, 1);

        await server.clock.advance(
            BackoffPolicy.CalculateDelayForAttempt(1, kInitialBackoffDelayMs));
        await Promise.resolve();

        // (3) The second attempt has now gone through, and succeeded.
        assert.equal(discord.state, DiscordSocket.kStateConnected);
        assert.equal(connectionEstablishedCalls, 1);
        assert.equal(connectionFailedCalls, 1);

        await connectionPromise;

        // Disconnect the socket, to make sure that's reflected as well.
        await discord.disconnect();

        assert.equal(discord.state, DiscordSocket.kStateDisconnected);
        assert.equal(connectionClosedCalls, 1);
    });

    it('should be able to join together partial JSON message data', async (assert) => {
        assert.equal(discord.state, DiscordSocket.kStateDisconnected);
        assert.equal(connectionEstablishedCalls, 0);
        assert.equal(connectionFailedCalls, 0);

        await Promise.all([
            discord.connect(kDiscordEndpoint),
            server.clock.advance(BackoffPolicy.CalculateDelayForAttempt(0, kInitialBackoffDelayMs)),
        ]);

        assert.equal(discord.state, DiscordSocket.kStateConnected);
        assert.equal(connectionEstablishedCalls, 1);
        assert.equal(connectionFailedCalls, 0);

        messageData = null;

        // Send a basic JavaScript object in two messages, each with part of the content.
        discord.onMessage({ data: stringToUtf8Buffer('{"text":"Hello, ') });
        assert.isNull(messageData);

        discord.onMessage({ data: stringToUtf8Buffer('world!"}') });
        assert.deepEqual(messageData, { text: 'Hello, world!' });
    });
});
