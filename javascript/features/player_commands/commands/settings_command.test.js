// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('SettingsCommand', (it, beforeEach) => {
    let announce = null;
    let gunther = null;
    let russell = null;

    beforeEach(async () => {
        const feature = server.featureManager.loadFeature('player_commands');

        announce = server.featureManager.loadFeature('announce');
        gunther = server.playerManager.getById(/* Gunther= */ 0);
        russell = server.playerManager.getById(/* Russell= */ 1);
        russell.level = Player.LEVEL_MANAGEMENT;

        await feature.registry_.initialize();
        await russell.identify();
    });

    // Indices of the menu items available in settings.
    const kAnnouncementIndex = 0;
    const kLanguageIndex = 1;

    it('should enable players to change their announcement preferences', async (assert) => {
        const kFirstIdentifier = 'admin/abuse/detected';

        // (1) Verify that the |kFirstIdentifier| category is enabled for |russell|.
        assert.isTrue(announce.isCategoryEnabledForPlayer(russell, kFirstIdentifier));

        // (2) Disable the |kFirstIdentifier| category through the command for |russell|.
        russell.respondToDialog({ listitem: kAnnouncementIndex }).then(
            () => russell.respondToDialog({ listitem: 0 /* Administration */ })).then(
            () => russell.respondToDialog({ listitem: 0 /* Abuse */ })).then(
            () => russell.respondToDialog({ listitem: 0 /* Anticheat (detected) */ })).then(
            () => russell.respondToDialog({ response: 1 /* confirm */ })).then(
            () => russell.respondToDialog({ response: 0 /* dismiss */ }));

        assert.isTrue(await russell.issueCommand('/my settings'));
        assert.isFalse(announce.isCategoryEnabledForPlayer(russell, kFirstIdentifier));

        // (3) Enable the |kFirstIdentifier| category by running the command again.
        russell.respondToDialog({ listitem: kAnnouncementIndex }).then(
            () => russell.respondToDialog({ listitem: 0 /* Administration */ })).then(
            () => russell.respondToDialog({ listitem: 0 /* Abuse */ })).then(
            () => russell.respondToDialog({ listitem: 0 /* Anticheat (detected) */ })).then(
            () => russell.respondToDialog({ response: 1 /* confirm */ })).then(
            () => russell.respondToDialog({ response: 0 /* dismiss */ }));

        assert.isTrue(await russell.issueCommand('/my settings'));
        assert.isTrue(announce.isCategoryEnabledForPlayer(russell, kFirstIdentifier));
    });
});
