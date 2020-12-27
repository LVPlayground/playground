// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { MockPawnInvoke } from 'base/test/mock_pawn_invoke.js';

import { messages } from 'features/communication_commands/communication_commands.messages.js';

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
            Message.format(Message.COMMUNICATION_ME, russell.colors.currentColor.toHexRGB(),
                           russell.name, 'is testing'));
    });

    it('should be able to show predefined messages to players', async (assert) => {
        const lucy = server.playerManager.getById(/* Lucy= */ 2);

        // (1) Unknown messages & preparing the cache.
        assert.isTrue(await russell.issueCommand('/show'));
        assert.equal(russell.messages.length, 3);
        assert.includes(russell.messages[0], '/show [');
        assert.includes(russell.messages[1], '/show [');

        assert.isTrue(await russell.issueCommand('/show bananaphone'));
        assert.equal(russell.messages.length, 6);
        assert.includes(russell.messages[2], '/show [');

        assert.includes(russell.messages[4], '/report/');  // we expect "report" for the next tests

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

    it('should be possible to slap (and slap back) other players', async (assert) => {
        const finance = server.featureManager.loadFeature('finance');

        muteManager.setCommunicationMuted(true);

        // (1) You shouldn't be able to slap other people when the server is muted.
        assert.isTrue(await gunther.issueCommand('/slap Russell'));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], messages.communication_slap_muted);

        muteManager.setCommunicationMuted(false);

        // (2) You shouldn't be able to slap back when you haven't been slapped before.
        assert.isTrue(await russell.issueCommand('/slapb'));

        assert.equal(russell.messages.length, 1);
        assert.equal(russell.messages[0], messages.communication_slap_no_history);

        // (3) You need some amount of money to slap other players.
        assert.isTrue(await gunther.issueCommand('/slap Russell'));

        assert.equal(gunther.messages.length, 2);
        assert.equal(
            gunther.messages[1], messages.communication_slap_no_funds(null, { price: 5000 }));

        finance.givePlayerCash(gunther, 1000000);
        finance.givePlayerCash(russell, 1000000);

        // (4) You *can* in fact successfully slap other players.
        assert.isTrue(await gunther.issueCommand('/slap Russell'));

        assert.equal(gunther.messages.length, 3);
        assert.includes(gunther.messages[2], 'around a bit with');

        assert.equal(russell.messages.length, 2);
        assert.includes(russell.messages[1], 'around a bit with');

        // (5) There's a rate limit in place when slapping players.
        assert.isTrue(await gunther.issueCommand('/slap Russell'));

        assert.equal(gunther.messages.length, 4);
        assert.includes(gunther.messages[3], messages.communication_slap_wait(null, {
            cooldown: '7 seconds',
        }));

        await server.clock.advance(7000);

        assert.isTrue(await gunther.issueCommand('/slap Russell'));

        assert.equal(gunther.messages.length, 5);
        assert.includes(gunther.messages[4], 'around a bit with');

        assert.equal(russell.messages.length, 3);
        assert.includes(russell.messages[2], 'around a bit with');

        // (6) The `/slapb` command should enable you to slap back quickly.
        assert.isTrue(await russell.issueCommand('/slapb'));

        assert.equal(gunther.messages.length, 6);
        assert.includes(gunther.messages[5], 'around a bit with');

        assert.equal(russell.messages.length, 4);
        assert.includes(russell.messages[3], 'around a bit with');

        // (7) That command stops working when they disconnect from the server.
        russell.disconnectForTesting();

        assert.isTrue(await gunther.issueCommand('/slapb'));

        assert.equal(gunther.messages.length, 7);
        assert.equal(gunther.messages[6], messages.communication_slap_no_target(null, {
            target: russell.name,
        }));
    });
});
