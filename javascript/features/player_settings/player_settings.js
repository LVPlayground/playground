// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Feature from 'components/feature_manager/feature.js';
import { PlayerSettingsManager } from 'features/player_settings/player_settings_manager.js';
import { PlayerSettingsSupplement } from 'features/player_settings/player_settings_supplement.js';
import SettingList from 'entities/player_setting_list.js';

// The account feature centralizes our interaction with player account data, for example their
// ability to log in, manage their account and their settings.
export default class PlayerSettings extends Feature {
    constructor() {
        super();
        
        this.manager_ = new PlayerSettingsManager();

        // Provide the settings supplement to the Player class. This makes the `settings` accessor
        // available on each player connected to the server.
        Player.provideSupplement('settings', PlayerSettingsSupplement, this.manager_, SettingList);
    }

    dispose() {
        Player.provideSupplement('settings', null);
    }
}
