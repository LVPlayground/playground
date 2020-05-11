// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { PlayerSettingsDatabase } from 'features/player_settings/player_settings_database.js';

import { MockPlayerSettingsDatabase } from 'features/player_settings/test/mock_player_settings_database.js';

export class PlayerSettingsManager {
    constructor() {
        // The database instance used to read and write persistent values.
        this.database_ = server.isTest() ? new MockPlayerSettingsDatabase()
                                         : new PlayerSettingsDatabase();

        server.playerManager.addObserver(this, true /* replayHistory */);
    }

    // Loads the settings of the player when a player has logged in
    onPlayerLogin(player) {
        if (!player.account.isRegistered()) {
            return;
        }

        // Load the existing persistent values from the database, and apply them to the local state.
        Promise.resolve(this.database_.loadSettings(player.account.userId)).then(settings => {
            for (const [identifier, value] of settings) {
                try {
                    player.settings.setValue(identifier, value);
                } catch (exception) {
                    console.log(`Warning: Unable to restore the player setting of ${identifier}:`);
                    console.log(exception);
                }
            }
        });
    }

    // Store the player data in the database.
    // Throws error if player has no userId
    updateSettingsInDatabase(player, identifier, value) {
        if (!player.account.userId)
            throw new Error('Unknown player in database. Player has no userId');

        const setting = player.settings.getSetting(identifier);

        // Either delete or write the new |value| from or to the database. Don't block on it.
        if (value === setting.defaultValue)
            this.database_.deleteSetting(setting, player.account.userId);
        else
            this.database_.writeSetting(setting, player.account.userId);
    }
}
