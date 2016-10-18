// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Feature = require('components/feature_manager/feature.js');
const SettingList = require('features/settings/setting_list.js');

// Provides the ability to get and set settings that should persist between server restarts. Values
// that have been changed from their defaults will be stored in the database.
class Settings extends Feature {
    constructor() {
        super();

        // Map of setting (as "category/name") to the corresponding Setting instance.
        this.settings_ = new Map();

        // Import the settings from the |SettingList| in to the local state.
        for (const setting of SettingList)
            this.settings_.set(setting.category + '/' + setting.name, setting);
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

    // ---------------------------------------------------------------------------------------------

    dispose() {}
}

exports = Settings;
