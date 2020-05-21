// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Feature from 'components/feature_manager/feature.js';
import { HaystackGame } from 'features/haystack/haystack_game.js';
import Setting from 'entities/setting.js';
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
            name: Haystack.prototype.generateName.bind(this),
            goal: 'Beat all others to the top of the haystack!',

            command: 'newhaystack',
            minimumPlayers: 1,
            maximumPlayers: 20,

            countdown: 4,
            countdownCamera: [
                new Vector(41.055019, -45.301830, 37.605308),
                new Vector(30.323097, 86.002151, 44.803482),
            ],
            countdownView: [
                new Vector(37.480472, -42.009181, 36.430114),
                new Vector(29.568088, 81.170539, 43.761600),
            ],

            settingsValidator: Haystack.prototype.validateSetting.bind(this),
            settings: [
                new Setting(
                    'haystack', 'difficulty', ['easy', 'normal', 'hard', 'extreme'], 'normal',
                    'Game difficulty'),
                new Setting('haystack', 'levels', Setting.TYPE_NUMBER, 30, 'Number of levels'),
                new Setting('haystack', 'nighttime', Setting.TYPE_BOOLEAN, false, 'Nighttime'),
            ],

            tick: 100,
        });
    }

    // Generates the name of the minigame based on the customized |settings|, if any.
    generateName(settings) {
        let prefix = '';
        let suffix = '';
        
        const difficulty = settings.get('haystack/difficulty');
        if (difficulty && difficulty !== 'normal')
            prefix = difficulty[0].toUpperCase() + difficulty.substring(1) + ' ';
        
        const levels = settings.get('haystack/levels');
        if (levels && levels !== 30)
            suffix = ` x${levels}`;
        
        return prefix + 'Haystack' + suffix;
    }

    // Validates the given settings. Only applicable to non-fixed types, i.e. numbers and strings.
    validateSetting(identifier, value) {
        switch (identifier) {
            case 'haystack/levels':
                if (value < 10)
                    throw new Error('The haystack game should have at least ten levels.');
                
                if (value > 100)
                    throw new Error('The haystack game should have at most a hundred levels.');
                
                return true;
        }

        throw new Error('Asked to validate an unknown setting.');
    }

    dispose() {
        this.games_().removeGame(HaystackGame);
    }
}
