// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Game } from 'features/games/game.js';
import { GameDescription,
         kDefaultMaximumPlayers,
         kDefaultMinimumPlayers,
         kDefaultPrice,
         kDefaultTickIntervalMs } from 'features/games/game_description.js';

import Setting from 'entities/setting.js';
import { Vector } from 'base/vector.js';


describe('GameDescription', it => {
    it('throws when the passed gameConstructor is not valid', assert => {
        assert.throws(() => new GameDescription());
        assert.throws(() => new GameDescription(GameDescription));
        assert.throws(() => new GameDescription(GameDescription, {}));
        assert.throws(() => new GameDescription(3.14));
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

        assert.isNull(description.command);
        assert.equal(description.maximumPlayers, kDefaultMaximumPlayers);
        assert.equal(description.minimumPlayers, kDefaultMinimumPlayers);
        assert.equal(description.price, kDefaultPrice);
        assert.equal(description.tick, kDefaultTickIntervalMs);
    });

    it('is able to initialize countdown settings', assert => {
        const description = new GameDescription(Game, {
            name: 'My game',
            goal: 'Have a countdown screen',

            countdown: 5,
            countdownCamera: [
                new Vector(10, 20, 30),
                new Vector(20, 30, 40),
            ],
            countdownView: [
                new Vector(15, 25, 35),
                new Vector(35, 45, 55),
            ],
        });

        assert.equal(description.countdown, 5);
        assert.equal(description.countdownCamera.length, 2);
        assert.equal(description.countdownView.length, 2);
    });

    it('is able to provide a series of configurable settings', assert => {
        const description = new GameDescription(Game, {
            name: 'My game',
            goal: 'Have some settings',

            settings: [
                new Setting('game', 'bonus', Setting.TYPE_NUMBER, 0, 'Percentage of bonus points'),
                new Setting('game', 'night', Setting.TYPE_BOOLEAN, false, 'Have it be night?'),
            ]
        });

        assert.equal(description.settings.size, 2);
        assert.isTrue(description.settings.has('game/bonus'));
        assert.isTrue(description.settings.has('game/night'));
        assert.isFalse(description.settings.get('game/night').defaultValue);
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
});
