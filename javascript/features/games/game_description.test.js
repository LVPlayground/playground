// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Game } from 'features/games/game.js';
import { GameDescription,
         kDefaultMaximumPlayers,
         kDefaultMinimumPlayers,
         kDefaultPrice,
         kDefaultTickIntervalMs } from 'features/games/game_description.js';

import { Setting } from 'entities/setting.js';
import { Vector } from 'base/vector.js';


describe('GameDescription', it => {
    it('throws when the passed gameConstructor is not valid', assert => {
        assert.throws(() => new GameDescription());
        assert.throws(() => new GameDescription(GameDescription));
        assert.throws(() => new GameDescription(GameDescription, {}));
        assert.throws(() => new GameDescription(3.14));
        assert.throws(() => new GameDescription(Game, {
            name: 'My game',
            goal: 'Verify continuous and minimumPlayers alignment',

            continuous: true,
            minimumPlayers: 2,  // <-- this throws
        }));
    });

    it('is able to reflect the bare minimum game with default options', assert => {
        const description = new GameDescription(Game, {
            name: 'My game',
            goal: 'Make this test work',
        });

        assert.strictEqual(description.gameConstructor, Game);
        assert.equal(description.name, 'My game');
        assert.equal(description.goal, 'Make this test work');

        assert.isNull(description.countdown);
        assert.isNull(description.countdownCamera);
        assert.isNull(description.countdownView);

        const environment = description.settings.get('game/environment').value;

        assert.equal(environment.time, 'Afternoon');
        assert.equal(environment.weather, 'Sunny');
        assert.equal(environment.gravity, 'Normal');

        assert.instanceOf(description.settings, Map);
        assert.equal(description.settings.size, GameDescription.kDefaultSettings.length);
        assert.isNull(description.settingsValidator);

        assert.isNull(description.command);
        assert.equal(description.maximumPlayers, kDefaultMaximumPlayers);
        assert.equal(description.minimumPlayers, kDefaultMinimumPlayers);
        assert.isFalse(description.preferCustom);
        assert.equal(description.price, kDefaultPrice);
        assert.equal(description.tick, kDefaultTickIntervalMs);
    });

    it('allows the game name to be passed as a function', assert => {
        const description = new GameDescription(Game, {
            name: (settings) => 'My name',
            goal: 'Make this test work',
        });

        assert.strictEqual(description.gameConstructor, Game);
        assert.equal(description.name, 'My name');
    });

    it('is able to initialize different sorts of settings', assert => {
        const description = new GameDescription(Game, {
            name: 'My game',
            goal: 'Have a countdown screen',

            preferCustom: true,

            countdown: 5,
            countdownCamera: [
                new Vector(10, 20, 30),
                new Vector(20, 30, 40),
            ],
            countdownView: [
                new Vector(15, 25, 35),
                new Vector(35, 45, 55),
            ],

            environment: {
                time: 'Night',
                weather: 'Foggy',
                gravity: 'Low',
            }
        });

        assert.equal(description.countdown, 5);
        assert.equal(description.countdownCamera.length, 2);
        assert.equal(description.countdownView.length, 2);

        const environment = description.settings.get('game/environment').value;

        assert.equal(environment.time, 'Night');
        assert.equal(environment.weather, 'Foggy');
        assert.equal(environment.gravity, 'Low');

        assert.isTrue(description.preferCustom);
    });

    it('is able to provide a series of configurable settings', assert => {
        const description = new GameDescription(Game, {
            name: 'My game',
            goal: 'Have some settings',

            settingsValidator: (identifier, value) => true,
            settings: [
                new Setting('game', 'bonus', Setting.TYPE_NUMBER, 0, 'Percentage of bonus points'),
                new Setting('game', 'night', Setting.TYPE_BOOLEAN, false, 'Have it be night?'),
            ]
        });

        assert.equal(description.settings.size, 2 + GameDescription.kDefaultSettings.length);
        assert.isTrue(description.settings.has('game/bonus'));
        assert.isTrue(description.settings.has('game/night'));
        assert.isFalse(description.settings.get('game/night').defaultValue);

        assert.typeOf(description.settingsValidator, 'function');
    });

    it('is able to validate the data being passed to the game', assert => {
        assert.throws(() => new GameDescription(Game, { }));
        assert.throws(() => new GameDescription(Game, { name: 3.14 }));

        assert.throws(() => new GameDescription(Game, { name: 'name', command: 3.14 }));
        assert.throws(() => new GameDescription(Game, { name: 'name', command: [] }));

        assert.throws(() => new GameDescription(Game, { name: 'name', maximumPlayers: 'all' }));
        assert.throws(() => new GameDescription(Game, { name: 'name', maximumPlayers: 3.14 }));
        assert.throws(() => new GameDescription(Game, { name: 'name', maximumPlayers: [] }));

        assert.throws(() => new GameDescription(Game, { name: 'name', minimumPlayers: 'all' }));
        assert.throws(() => new GameDescription(Game, { name: 'name', minimumPlayers: 3.14 }));
        assert.throws(() => new GameDescription(Game, { name: 'name', minimumPlayers: [] }));

        assert.throws(() => new GameDescription(Game, { name: 'name', price: 3.14 }));
        assert.throws(() => new GameDescription(Game, { name: 'name', price: 'gold' }));
        assert.throws(() => new GameDescription(Game, { name: 'name', price: [] }));
    });
    
    it('is able to format game scores based on configuration', assert => {
        const number = new GameDescription(Game, { name: 'n', goal: 'g', scoreType: 'number' });
        const time = new GameDescription(Game, { name: 'n', goal: 'g', scoreType: 'time' });

        assert.equal(number.formatScore(0), 'with a score of 0');
        assert.equal(number.formatScore(1), 'with a score of 1');
        assert.equal(number.formatScore(255), 'with a score of 255');
        assert.equal(number.formatScore(1024), 'with a score of 1,024');

        assert.equal(time.formatScore(1), 'in one second');
        assert.equal(time.formatScore(25), 'in 25 seconds');
        assert.equal(time.formatScore(60), 'in 1:00 minutes');
        assert.equal(time.formatScore(91), 'in 1:31 minutes');
        assert.equal(time.formatScore(3600), 'in 1:00 hours');
        assert.equal(time.formatScore(3600 * 50), 'in a silly amount of time');
    });
});
