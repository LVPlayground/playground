// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { HaystackGame,
         kEdge,
         kPlayerProgressInterval,
         } from 'features/haystack/haystack_game.js';

import ScopedEntities from 'entities/scoped_entities.js';
import { Vector } from 'base/vector.js';

describe('HaystackGame', (it, beforeEach) => {
    let gunther = null;
    let russell = null;

    beforeEach(() => {
        server.featureManager.loadFeature('haystack');

        gunther = server.playerManager.getById(/* Gunther= */ 0);
        russell = server.playerManager.getById(/* Russell= */ 1);
    });

    const kDefaultSettings = new Map([
        [ 'haystack/difficulty', 'normal' ],
        [ 'haystack/levels', 30 ],
        [ 'haystack/nighttime', false ],
    ]);

    it('should have registered the game with the server', assert => {
        assert.isTrue(server.commandManager.hasCommand('newhaystack'));
    });

    it('is able to generate different names based on settings', async (assert) => {
        const feature = server.featureManager.loadFeature('haystack');

        assert.equal(feature.generateName(new Map()), 'Haystack');
        assert.equal(
            feature.generateName(new Map([ ['haystack/difficulty', 'extreme' ]])),
            'Extreme Haystack');
        
        assert.equal(
            feature.generateName(new Map([ ['haystack/levels', 25 ]])),
            'Haystack x25');
        
        assert.equal(
            feature.generateName(new Map([ ['haystack/difficulty', 'easy' ],
                                           [ 'haystack/levels', 55 ] ])),
            'Easy Haystack x55');
    });

    it('should pick appropriate configuration based on difficulty level', async (assert) => {
        const normalGame = new HaystackGame(/* runtime= */ null, new ScopedEntities());
        await normalGame.onInitialized(kDefaultSettings);

        const extremeGame = new HaystackGame(/* runtime= */ null, new ScopedEntities());
        await extremeGame.onInitialized(new Map([
            [ 'haystack/difficulty', 'extreme' ],
            [ 'haystack/levels', 40 ],
            [ 'haystack/nighttime', true ],
        ]));

        assert.isBelow(extremeGame.settings_.hayDensity, normalGame.settings_.hayDensity);
        assert.isAbove(extremeGame.settings_.rockDensity, normalGame.settings_.rockDensity);
        assert.isAbove(extremeGame.settings_.speedAdjustment, normalGame.settings_.speedAdjustment);
        assert.isBelow(extremeGame.settings_.tickSkip, normalGame.settings_.tickSkip);

        assert.equal(extremeGame.settings_.levels, 40);
        assert.deepEqual(extremeGame.settings_.time, [ 1, 30 ]);
    });

    it('should populate the matrix at the configured density', async (assert) => {
        const game = new HaystackGame(/* runtime= */ null, new ScopedEntities());
        await game.onInitialized(kDefaultSettings);

        let haystackCount = 0;
        let rockCount = 0;

        // Iterate over each cell in the matrix to find out what type of.. thing it is.
        for (let x = 0; x < kEdge; ++x) {
            for (let y = 0; y < kEdge; ++y) {
                for (let z = 0; z < game.settings_.levels; ++z) {
                    switch (game.matrix_[x][y][z].type) {
                        case HaystackGame.kPositionEmpty:
                            break;
                        
                        case HaystackGame.kPositionHaystack:
                            haystackCount++;
                            break;
                        
                        case HaystackGame.kPositionRock:
                            rockCount++;
                            break;
                        
                        default:
                            throw new Error('Invalid type found in haystack matrix');
                    }
                }
            }
        }

        // Verify that the number of items that were found in the hay stack corresponds to the
        // density that's been configured for the game.
        const totalCount = kEdge * kEdge * game.settings_.levels;

        assert.closeTo(haystackCount, totalCount * game.settings_.hayDensity, 2);
        assert.closeTo(rockCount, totalCount * game.settings_.rockDensity, 2);
    });

    it('should be able to randomly move the haystacks around', async (assert) => {
        const fakeRuntime = new class {
            get players() { return [ gunther ]; }
        };

        const game = new HaystackGame(fakeRuntime, new ScopedEntities());
        await game.onInitialized(kDefaultSettings);

        let matrixHash = 0;
        let updateHash = 0;
        
        // Calculate a "hash" for the matrix's set up as it currently is.
        for (let x = 0; x < kEdge; ++x)
            for (let y = 0; y < kEdge; ++y)
                for (let z = 0; z < game.settings_.levels; ++z)
                    matrixHash += (x + 1) * (y + 100) * (z + 100) * (game.matrix_[x][y][z].type + 1)

        // Fake 50 ticks, which should statistically lead to at least a few movements.
        for (let iteration = 0; iteration < 50; ++iteration)
            await game.onTick();

        // Now calculate the hash again. We expect them to be different.
        for (let x = 0; x < kEdge; ++x)
            for (let y = 0; y < kEdge; ++y)
                for (let z = 0; z < game.settings_.levels; ++z)
                    updateHash += (x + 1) * (y + 100) * (z + 100) * (game.matrix_[x][y][z].type + 1)
        
        assert.notEqual(matrixHash, updateHash);
    });

    it('should move hay faster the further up the haystack we go', async (assert) => {
        const game = new HaystackGame(/* runtime= */ null, new ScopedEntities());
        await game.onInitialized(kDefaultSettings);

        for (const direction of ['x', 'z']) {
            let previous = game.determineMovementSpeed(0, direction);

            for (let level = 1; level < game.settings_.levels; ++level) {
                const current = game.determineMovementSpeed(level, direction);
                
                assert.setContext(`${level}/${direction}`);
                assert.isAbove(current, previous);

                previous = current;
            }
        }
    });

    it('should mark a player as having won when they reach the top', async (assert) => {
        let victor = null;

        const fakeRuntime = new class {
            get players() { return [ gunther ]; }
            playerWon(player) { victor = player; }
        };

        const game = new HaystackGame(fakeRuntime, new ScopedEntities());
        await game.onInitialized(kDefaultSettings);

        assert.isNull(victor);

        gunther.position = new Vector(-12, -12, 16);

        // Tick. |gunther|'s position is well below the game's ceiling.
        for (let tick = 0; tick < kPlayerProgressInterval; ++tick)
            await game.onTick();
        
        gunther.position = new Vector(100, 100, (game.settings_.levels + 1) * 3);

        // Tick. |gunther|'s up high enough, but not standing on the haystacks.
        for (let tick = 0; tick < kPlayerProgressInterval; ++tick)
            await game.onTick();
    
        gunther.position = new Vector(-12, -12, (game.settings_.levels + 2) * 3);

        // Tick. |gunther| has won for reals this time.
        for (let tick = 0; tick < kPlayerProgressInterval; ++tick)
            await game.onTick();
        
        assert.isNotNull(victor);
    });
});
