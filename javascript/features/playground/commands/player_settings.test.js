// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { PlayerSetting } from 'entities/player_setting.js';

describe('PlayerSettingsCommands', (it, beforeEach) => {
    beforeEach(async () => {
        const feature = server.featureManager.loadFeature('playground');
        await feature.commands_.loadCommands();
    });

    it('should not let players use the playersettings command', async (assert) => {
        const gunther = server.playerManager.getById(0);

        gunther.level = Player.LEVEL_PLAYER

        assert.isTrue(await gunther.issueCommand('/playersettings'));
        assert.equal(gunther.messages.length, 1);
    });

    it('should let admins use the playersettings command', async (assert) => {
        return;  // disabled

        const gunther = server.playerManager.getById(0);

        gunther.level = Player.LEVEL_ADMINISTRATOR;
        await gunther.identify();

        gunther.respondToDialog({ listitem: 0 /* Assumed `announcements` */ }).then(
            () => gunther.respondToDialog({ listitem: 0 /* Assumed to be general */ })).then(
            () => gunther.respondToDialog({ listitem: 1 /* Assumed to be disable */ })).then(
            () => gunther.respondToDialog({ response: 1 /* Yeah I get it */ }));

        var originalSetting = gunther.settings.getValue(`${PlayerSetting.CATEGORY.ANNOUNCEMENT}/${PlayerSetting.ANNOUNCEMENT.UNCATEGORIZED}/${PlayerSetting.SUBCOMMAND.GENERAL}`);
        assert.isTrue(await gunther.issueCommand('/playersettings'));
        var updatedSetting = gunther.settings.getValue(`${PlayerSetting.CATEGORY.ANNOUNCEMENT}/${PlayerSetting.ANNOUNCEMENT.UNCATEGORIZED}/${PlayerSetting.SUBCOMMAND.GENERAL}`);
        assert.equal(updatedSetting, !originalSetting);
    });
});