// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Feature from 'components/feature_manager/feature.js';
import { HaystackGame } from 'features/haystack/haystack_game.js';
import { Vector } from 'base/vector.js';

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

            countdown: 4,
            countdownCamera: [
                new Vector(41.055019, -45.301830, 37.605308),
                new Vector(30.323097, 86.002151, 44.803482),
            ],
            countdownView: [
                new Vector(37.480472, -42.009181, 36.430114),
                new Vector(29.568088, 81.170539, 43.761600),
            ],

            command: 'newhaystack',
            minimumPlayers: 1,
            maximumPlayers: 20,
        });
    }

    dispose() {
        this.games_().removeGame(HaystackGame);
    }
}
