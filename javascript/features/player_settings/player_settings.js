// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Feature from 'components/feature_manager/feature.js';
import { PlayerSettingsSupplement } from 'features/player_settings/player_settings_supplement.js';

// The account feature centralizes our interaction with player account data, for example their
// ability to log in, manage their account and their settings.
export default class PlayerSettings extends Feature {
    constructor() {
        super();
        // Provide the settings supplement to the Player class. This makes the `settings` accessor
        // available on each player connected to the server.
        Player.provideSupplement('settings', PlayerSettingsSupplement);
        
        server.playerManager.addObserver(this, true /* replayHistory */);
    }

    // Loads the settings of the player when a player has logged in
    onPlayerLogin(player) {
        player.settings.loadSettings();
    }

    dispose() {
        Player.provideSupplement('settings', null);
    }
}
