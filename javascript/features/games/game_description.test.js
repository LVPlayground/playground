// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { GameDescription } from 'features/games/game_description.js';
import { Game } from 'features/games/game.js';

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
        });

        assert.strictEqual(description.gameConstructor, Game);
        assert.equal(description.name, 'My game');

        assert.isNull(description.command);
    });
});
