// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import MockPawnInvoke from 'base/test/mock_pawn_invoke.js';

describe('CommunicationCommands', (it, beforeEach) => {
    let gunther = null;
    let russell = null;

    let muteManager = null;

    beforeEach(async() => {
        server.featureManager.loadFeature('communication_commands');

        const communication = server.featureManager.loadFeature('communication');

        muteManager = communication.muteManager_;

        gunther = server.playerManager.getById(/* Gunther= */ 0);
        russell = server.playerManager.getById(/* Russell= */ 1);
        russell.level = Player.LEVEL_ADMINISTRATOR;

        await russell.identify();
    });

    it('should enable administrators to make announcements', async (assert) => {
        assert.isTrue(await russell.issueCommand('/announce Hello George!!'));

        assert.equal(gunther.messages.length, 3);
        assert.includes(gunther.messages[1], 'Hello Geroge!!');
    });

    it('should enable administrators to clear the chat', async (assert) => {
        const mockInvoke = MockPawnInvoke.getInstance();
        const currentCalls = mockInvoke.calls.length;

        assert.isTrue(await russell.issueCommand('/clear'));

        assert.equal(mockInvoke.calls.length, currentCalls + 120);
        assert.equal(mockInvoke.calls[currentCalls].fn, 'SendClientMessageToAll');
    });

    it('should be able to show IRC-style status messages', async (assert) => {
        // (1) Integration of the command with the Communication feature
        muteManager.setCommunicationMuted(true);

        assert.isTrue(await russell.issueCommand('/me is testing'));
        assert.equal(russell.messages.length, 1);
        assert.equal(
            russell.messages[0], Message.format(Message.COMMUNICATION_SERVER_MUTE_BLOCKED));
        
        muteManager.setCommunicationMuted(false);
        assert.equal(gunther.messages[0]);

        // (2) Ability to send a regular message.
        assert.isTrue(await russell.issueCommand('/me is testing'));
        assert.equal(russell.messages.length, 2);
        assert.equal(
            russell.messages[1],
            Message.format(Message.COMMUNICATION_ME, russell.color.toHexRGB(), russell.name,
                           'is testing'));
    });

    it('should be able to show predefined messages to players', async (assert) => {
        const lucy = server.playerManager.getById(/* Lucy= */ 2);

        // (1) Unknown messages & preparing the cache.
        assert.isTrue(await russell.issueCommand('/show bananaphone'));
        assert.equal(russell.messages.length, 1);
        assert.includes(russell.messages[0], '/show [');

        assert.includes(russell.messages[0], '/report/');  // we expect "report" for the next tests

        // (2) Showing a message to all players.
        assert.isTrue(await russell.issueCommand('/show report'));

        assert.equal(gunther.messages.length, 3);
        assert.equal(gunther.messages[0], Message.ANNOUNCE_HEADER);
        assert.includes(gunther.messages[1], 'using /report [');  // this fails if the message changes
        assert.equal(gunther.messages[2], Message.ANNOUNCE_HEADER);

        assert.equal(lucy.messages.length, 3);

        // (3) Showing a message to a particular player.
        assert.isTrue(await russell.issueCommand('/show report Lucy'));

        assert.equal(gunther.messages.length, 3);  // no change for Gunther

        assert.equal(lucy.messages.length, 6);
        assert.equal(lucy.messages[3], Message.ANNOUNCE_HEADER);
        assert.includes(lucy.messages[4], 'using /report [');  // this fails if the message changes
        assert.equal(lucy.messages[5], Message.ANNOUNCE_HEADER);
    });

    it('should automatically show predefined messages at a configured interval', async (assert) => {
        const feature = server.featureManager.loadFeature('communication_commands');
        const guntherCyclePromise = feature.runTheGuntherCycle();
        const settings = server.featureManager.loadFeature('settings');

        const kIntervalSec = 300;

        settings.setValue('playground/gunther_help_interval_sec', kIntervalSec);

        assert.equal(gunther.messages.length, 0);

        await server.clock.advance(kIntervalSec * 1000);
        assert.equal(gunther.messages.length, 3);

        await server.clock.advance(kIntervalSec * 1000);
        assert.equal(gunther.messages.length, 6);
        
        feature.disposed_ = true;  // fake a dispose() call

        await Promise.all([
            server.clock.advance(kIntervalSec * 1000),
            guntherCyclePromise
        ]);
    });
});
