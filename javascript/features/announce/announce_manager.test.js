// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import AnnounceManager from 'features/announce/announce_manager.js';
import PlayerSetting from 'entities/player_setting.js';

describe('AnnounceManager', (it, beforeEach, afterEach) => {
    let announceManager = null;
    let nuwani = null;

    beforeEach(() => {
        nuwani = server.featureManager.loadFeature('nuwani');
        const settings = server.featureManager.loadFeature('settings');

        announceManager = new AnnounceManager(() => nuwani, () => settings);
    });

    it('should announce new minigames to players', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        const name = 'Hello Kitty Playground';
        const command = '/hko';
        const price = 25000;

        announceManager.announceMinigame(gunther, name, command, price);

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0],
                     Message.format(Message.ANNOUNCE_MINIGAME, name, command));
    });

    it('should announce minigame participation to players', async assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        const name = 'Hello Kitty Playground';
        const command = '/hko';

        announceManager.announceMinigameParticipation(gunther, name, command);

        // Verify that a call to Pawn will be issued as a microtask to avoid reentrancy issues.
        {
            assert.noPawnCall('OnDisplayNewsMessage');
            await Promise.resolve();
            assert.pawnCall('OnDisplayNewsMessage');
        }

        assert.equal(gunther.messages.length, 0);

        // TODO(Russell): Test the message through the news controller when possible.

        assert.equal(nuwani.messagesForTesting.length, 1);
        assert.deepEqual(nuwani.messagesForTesting[0], {
            tag: 'notice-minigame',
            params: [
                gunther.name,
                gunther.id,
                name,
            ]
        });
    });
    
    it('should not announce to administrators if main command is not enabled', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        gunther.level = Player.LEVEL_ADMINISTRATOR;

        announceManager.settings_().setValue(
            `${PlayerSetting.CATEGORY.ANNOUNCEMENT}/${PlayerSetting.ANNOUNCEMENT.HOUSES}/${PlayerSetting.SUBCOMMAND.HOUSES_SELL}`, 
            true, 0);
        announceManager.settings_().setValue(
            `${PlayerSetting.CATEGORY.ANNOUNCEMENT}/${PlayerSetting.ANNOUNCEMENT.HOUSES}/${PlayerSetting.SUBCOMMAND.GENERAL}`,
            false, 0);

        announceManager.announceToAdministratorsWithFilter('Hey guys.', 
            PlayerSetting.ANNOUNCEMENT.HOUSES,  PlayerSetting.SUBCOMMAND.HOUSES_SELL);

        assert.equal(gunther.messages.length, 0);
        assert.equal(nuwani.messagesForTesting.length, 0);
    });
    
    
    it('should not announce to administrators if it is not enabled', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        gunther.level = Player.LEVEL_ADMINISTRATOR;

        announceManager.announceToAdministratorsWithFilter('Hey guys.', 
            PlayerSetting.ANNOUNCEMENT.HOUSES,  PlayerSetting.SUBCOMMAND.HOUSES_SELL);

        assert.equal(gunther.messages.length, 0);
        assert.equal(nuwani.messagesForTesting.length, 0);
    });
    
    it('should not announce to nuwani if it is not enabled', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        gunther.level = Player.LEVEL_ADMINISTRATOR;

        announceManager.settings_().setValue(
            `${PlayerSetting.CATEGORY.ANNOUNCEMENT}/${PlayerSetting.ANNOUNCEMENT.UNCATEGORIZED}/${PlayerSetting.SUBCOMMAND.GENERAL}`, 
            false, 0);

        announceManager.announceToAdministratorsWithFilter('Hey guys!!11!!!1!!!', 
            PlayerSetting.ANNOUNCEMENT.UNCATEGORIZED, PlayerSetting.SUBCOMMAND.GENERAL);

        assert.equal(nuwani.messagesForTesting.length, 0);
    });

    it('should distribute messages to players', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);

        announceManager.announceToPlayers('Hello, world!');

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.format(Message.ANNOUNCE_ALL, 'Hello, world!'));

        assert.equal(russell.messages.length, 1);
        assert.equal(russell.messages[0], Message.format(Message.ANNOUNCE_ALL, 'Hello, world!'));

        assert.equal(nuwani.messagesForTesting.length, 1);
        assert.deepEqual(nuwani.messagesForTesting[0], {
            tag: 'notice-announce',
            params: [
                'Hello, world!',
            ]
        });
    });

    it('should distribute messages to administrators', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);

        russell.level = Player.LEVEL_ADMINISTRATOR;

        announceManager.announceToAdministrators('Hello, admins!');

        assert.equal(gunther.messages.length, 0);

        assert.equal(russell.messages.length, 1);
        assert.equal(russell.messages[0],
                     Message.format(Message.ANNOUNCE_ADMINISTRATORS, 'Hello, admins!'));

        assert.equal(nuwani.messagesForTesting.length, 1);
        assert.deepEqual(nuwani.messagesForTesting[0], {
            tag: 'notice-admin',
            params: [
                'Hello, admins!',
            ]
        });
    });

    it('should distribute reports to administrators', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);
        const lucy    = server.playerManager.getById(2 /* Lucy */);

        russell.level = Player.LEVEL_ADMINISTRATOR;

        announceManager.announceReportToAdministrators(lucy, gunther, 'much moneyz');

        assert.equal(gunther.messages.length, 0);

        assert.equal(russell.messages.length, 1);
        assert.equal(russell.messages[0],
            Message.format(Message.ANNOUNCE_REPORT, lucy.name, lucy.id, gunther.name, gunther.id,
                           'much moneyz'));

        assert.equal(lucy.messages.length, 0);

        assert.equal(nuwani.messagesForTesting.length, 1);
        assert.deepEqual(nuwani.messagesForTesting[0], {
            tag: 'notice-report',
            params: [
                lucy.name,
                lucy.id,
                gunther.name,
                gunther.id,
                'much moneyz',
            ]
        });
    });
});
