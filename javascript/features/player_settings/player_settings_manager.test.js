// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import PlayerSettings from 'features/player_settings/player_settings.js';

describe('PlayerSettingsManager', (it, beforeEach, afterEach) => {
    let manager = null;
    let playerSettings = null;

    beforeEach(() => {
        server.featureManager.registerFeaturesForTests({
            player_settings: PlayerSettings
        });

        playerSettings = server.featureManager.loadFeature('player_settings');

        manager = playerSettings.manager_;
    });

    afterEach(() => {
        playerSettings.dispose();
    });

    it('should throw error if invalid userId is given', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        assert.throws(() => manager.updateSettingsInDatabase(gunther, '', ''));
    });

    it('should write database if changed setting is given', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.identify();

        assert.equal(manager.database_.writeCalls, 0);

        manager.updateSettingsInDatabase(gunther, 'announcement/uncategorized/general', false);

        assert.equal(manager.database_.writeCalls, 1);
    });

    it('should delete setting from database if default value setting is given', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.identify();

        assert.equal(manager.database_.deleteCalls, 0);

        manager.updateSettingsInDatabase(gunther, 'announcement/uncategorized/general', true);

        assert.equal(manager.database_.deleteCalls, 1);
    });

    it('should load data from database upon player logged in', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        assert.equal(manager.database_.loadCalls, 0);

        gunther.identify();

        assert.equal(manager.database_.loadCalls, 1);
    });
});