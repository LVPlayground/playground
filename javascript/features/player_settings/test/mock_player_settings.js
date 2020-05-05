// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import SettingList from 'features/player_settings/player_setting_list.js';
import PlayerSettings from 'features/player_settings/player_settings.js';
import PlayerSetting from 'features/player_settings/player_setting.js';

import MockPlayerSettingsDatabase from 'features/player_settings/test/mock_player_settings_database.js';

class MockPlayerSettings {

    constructor() {
        this.settings_ = new Map();
        
        // The database instance used to read and write persistent values.
        this.database_ = new MockPlayerSettingsDatabase();

        // Import the settings from the |SettingList| in to the local state.
        for (const setting of SettingList) {
            this.settings_.set(setting.identifier, setting);
        }
    }

    get settings() { return this.settings_; }

    get announcementSettings() {
        return new Map([...this.settings_].filter(([key, setting]) => setting.category === PlayerSetting.CATEGORY.ANNOUNCEMENT));
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
}

export default MockPlayerSettings;