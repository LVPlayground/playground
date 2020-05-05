// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Feature from 'components/feature_manager/feature.js';
import PlayerSetting from 'features/player_settings/player_setting.js';
import SettingList from 'features/player_settings/player_setting_list.js';
import PlayerSettingsDatabase from 'features/player_settings/player_settings_database.js';

import MockPlayerSettingsDatabase from 'features/player_settings/test/mock_player_settings_database.js';

// Provides the ability to get and set settings for a player that should persist between server restarts. 
// Values that have been changed from their defaults will be stored in the database.
class PlayerSettings extends Feature {
    constructor() {
        super();

        // The database instance used to read and write persistent values.
        this.database_ = server.isTest() ? new MockPlayerSettingsDatabase()
            : new PlayerSettingsDatabase();

        // Map of setting identifiers (as "category/subcategory/subcommand") to the corresponding Setting instance.
        this.settings_ = new Map();

        // Import the settings from the |SettingList| in to the local state.
        for (const setting of SettingList)
            this.settings_.set(setting.identifier, setting);

        server.playerManager.addObserver(this, true /* replayHistory */);
    }

    // Loads the settings of the player when a player has logged in
    onPlayerLogin(player) {
        if(player.userId === null || player.userId === undefined){
            return;
        }
        
        // Load the existing persistent values from the database, and apply them to the local state.
        Promise.resolve(this.database_.loadSettings(player.userId)).then(settings => {
            for (const [identifier, value] of settings) {
                try {
                    this.setValue(identifier, value, player.userId);
                } catch (exception) {
                    console.log('Warning: Unable to restore the player setting of ' + identifier + ': ' +
                        exception);
                }
            }
        });
    }

    // Gets the map of the settings.
    get settings() { return this.settings_; }

    // Gets the map of all settings with category set as announcement
    get announcementSettings() {
        return new Map([...this.settings_].filter(([key, setting]) => setting.category == PlayerSetting.CATEGORY.ANNOUNCEMENT));
    }

    // ---------------------------------------------------------------------------------------------

    // Gets the value currently assigned to the |identifier|. Will throw when the |identifier| is
    // not known to the settings system, since we can't return anything sensible in that case.
    getValue(identifier) {
        const setting = this.settings_.get(identifier);
        if (!setting)
            throw new Error('Invalid setting given: ' + identifier);

        return setting.value;
    }

    // Sets the value of the setting identified by |identifier| to |value|. Type checking will be
    // done to make sure that the updated value is valid for the setting.
    setValue(identifier, value, userId) {
        const setting = this.settings_.get(identifier);
        if (!setting)
            throw new Error('Invalid setting given: ' + identifier);

        switch (setting.type) {
            case PlayerSetting.TYPE_BOOLEAN:
                if (typeof value !== 'boolean')
                    throw new Error('The value for ' + identifier + ' must be a boolean.');

                break;

            default:
                throw new Error('Unknown type for the setting ' + identifier + '.');
        }

        setting.value = value;

        // Either delete or write the new |value| from or to the database. Don't block on it.
        if (value === setting.defaultValue)
            this.database_.deleteSetting(setting, userId);
        else
            this.database_.writeSetting(setting, userId);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        for (const setting of this.settings_.values())
            setting.value = setting.defaultValue;

        this.settings_.clear();
        this.settings_ = null;
    }
}

export default PlayerSettings;
