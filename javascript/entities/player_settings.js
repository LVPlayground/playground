// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import PlayerSetting from 'entities/player_setting.js';
import SettingList from 'entities/player_setting_list.js';


// Provides the ability to get and set settings for a player that should persist between server restarts. 
// Values that have been changed from their defaults will be stored in the database.
class PlayerSettings {
    constructor() {
        // Map of setting identifiers (as "category/subcategory/subcommand") to the corresponding Setting instance.
        this.settings_ = new Map();

        // Import the settings from the |SettingList| in to the local state.
        for (const setting of SettingList)
            this.settings_.set(setting.identifier, setting.clone());
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
