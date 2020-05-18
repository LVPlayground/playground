// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { GameActivity } from 'features/games/game_activity.js';

// Provides the runtime for hosting a Game instance, i.e. takes care of forwarding the appropriate
// events, manages players and lifetimes of objects, vehicles and other entities.
export class GameRuntime extends GameActivity {
    description_ = null;
    registration_ = null;

    // Gets the GameDescription instance that describes what we're running here.
    get description() { return this.description_; }

    constructor(description, registration) {
        super();

        this.description_ = description;
        this.registration_ = registration;
    }

    // Called when the |player| has to be removed from the game, either because they disconnected,
    // were forced out by an administrator, or chose to execute `/leave` themselves.
    removePlayer(player) {}

    // ---------------------------------------------------------------------------------------------
    // GameActivity implementation

    getActivityState() { return GameActivity.kStateEngaged; }
    getActivityName() { return this.description_.name; }
}
