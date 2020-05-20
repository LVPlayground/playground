// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Feature from 'components/feature_manager/feature.js';
import { HaystackGame } from 'features/haystack/haystack_game.js';

// Provides the haystack game, in which players have to climb a series of haystacks to reach the
// top of the tower. Implemented on top of the Games infrastructure.
export default class Haystack extends Feature {
    games_ = null;

    constructor() {
        super();

        // The Haystack feature is a game, and will register itself as such.
        this.games_ = this.defineDependency('games');
        this.games_.addReloadObserver(this, () => this.initialize());

        this.initialize();
    }

    // Initializes the Haystack game by registering the game with the Games runtime.
    initialize() {
        this.games_().registerGame(HaystackGame, {
            name: 'Haystack',
            goal: 'Beat all others to the top of the haystack!',
            command: 'newhaystack',
            minimumPlayers: 1,
            maximumPlayers: 20,
        });
    }

    dispose() {
        this.games_().removeGame(HaystackGame);
    }
}
