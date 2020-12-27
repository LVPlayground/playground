// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { EnvironmentSettings } from 'features/games/environment_settings.js';
import { Game } from 'features/games/game.js';

// Implementation of the Game class that provides the low-level functionality offered directly by
// the Games API. Most features will want to extend this class rather than Game directly.
export class GameBase extends Game {
    #gravity_ = null;
    #time_ = null;
    #weather_ = null;

    async onInitialized(settings, userData) {
        const environment = settings.get('game/environment');
        if (environment) {
            this.#gravity_ = EnvironmentSettings.getGravityForOption(environment.gravity);
            this.#time_ = EnvironmentSettings.getTimeForOption(environment.time);
            this.#weather_ = EnvironmentSettings.getWeatherForOption(environment.weather);
        }
    }

    async onPlayerAdded(player) {
        // Update the gravity, time and weather for the |player|, but only when necessary.
        if (this.#gravity_)
            player.gravity = this.#gravity_;
        
        if (this.#time_)
            player.time = [ this.#time_, 20 ];
        
        if (this.#weather_)
            player.weather = this.#weather_;
    }

    async onPlayerRemoved(player) {
        // Restore the gravity for the player. The |player|'s weather and time will be reset when
        // their state gets deserialized immediately after this.
        if (this.#gravity_)
            player.gravity = Player.kDefaultGravity;
    }
}
