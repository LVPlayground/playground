// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { AnnounceManager } from 'features/announce/announce_manager.js';
import { PlayerSetting } from 'entities/player_setting.js';

describe('AnnounceManager', (it, beforeEach, afterEach) => {
    let announceManager = null;
    let nuwani = null;

    beforeEach(() => {
        server.featureManager.loadFeature('player_settings');
        nuwani = server.featureManager.loadFeature('nuwani');
        const settings = server.featureManager.loadFeature('settings');

        announceManager = new AnnounceManager(() => nuwani, () => settings);
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
