// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Supplement } from 'base/supplementable.js';
import PlayerSetting from 'entities/player_setting.js';
import { PlayerSettingsDatabase } from 'features/player_settings/player_settings_database.js';
import SettingList from 'entities/player_setting_list.js';

import { MockPlayerSettingsDatabase } from 'features/player_settings/test/mock_player_settings_database.js';


// Supplements the Player object with an `settings` accessor, giving other features access to the
// persistent settings of the players. If player is not registered settings are not persistent.
export class PlayerSettingsSupplement extends Supplement {
    player_ = null;
    database_ = null;

    constructor(player) {
        super();
        this.player_ = player;

        this.settings_ = new Map();

        // Import the settings from the |SettingList| in to the local state.
        for (const setting of SettingList)
            this.settings_.set(setting.identifier, setting.clone());

        // The database instance used to read and write persistent values.
        this.database_ = server.isTest() ? new MockPlayerSettingsDatabase()
            : new PlayerSettingsDatabase();
    }

     // Gets the map of the settings.
     get settings() { return this.settings_; }

     // Gets the map of all settings with category set as announcement
     get announcementSettings() {
         return new Map([...this.settings_]
            .filter(([_, setting]) => setting.category == PlayerSetting.CATEGORY.ANNOUNCEMENT));
     }

     loadSettings() {
        if(!this.player_.isRegistered()) {
            return;
        }   
        
        // Load the existing persistent values from the database, and apply them to the local state.
        Promise.resolve(this.database_.loadSettings(this.player_.userId)).then(settings => {
            for (const [identifier, value] of settings) {
                try {
                    this.setValue(identifier, value);
                } catch (exception) {
                    console.log(`Warning: Unable to restore the player setting of ${identifier}: ` +
                        exception);
                }
            }
        });

     }
     
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
    setValue(identifier, value) {
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
    }

    updateSetting(identifier, value) {
        this.setValue(identifier, value);
        
        if(!this.player_.isRegistered()) {
            return;
        }

        var setting = this.player_.settings.settings.get(identifier);

        // Either delete or write the new |value| from or to the database. Don't block on it.
        if (value === setting.defaultValue)
            this.database_.deleteSetting(setting, this.player_.userId);
        else
            this.database_.writeSetting(setting, this.player_.userId);        
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        for (const setting of this.settings_.values())
            setting.value = setting.defaultValue;

        this.settings_.clear();
        this.settings_ = null;
    }
}
