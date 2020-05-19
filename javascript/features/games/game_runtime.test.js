// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { GameDescription, kDefaultTickIntervalMs } from 'features/games/game_description.js';
import { GameRuntime } from 'features/games/game_runtime.js';
import { Game } from 'features/games/game.js';

describe('GameRuntime', (it, beforeEach) => {
    let gunther = null;
    let manager = null;
    let russell = null;

    beforeEach(() => {
        const feature = server.featureManager.loadFeature('games');

        manager = feature.manager_;

        gunther = server.playerManager.getById(/* Gunther= */ 0);
        russell = server.playerManager.getById(/* Russell= */ 1);
    });

    // Runs the game described in |description| with a dedicated runtime, making the given set of
    // |players| join it. Will not return until the game is finished.
    async function runGame(description, players) {
        const runtime = new GameRuntime(manager, description);
        
        await runtime.initialize();
        for (const player of players)
            await runtime.addPlayer(player);
        
        await runtime.run();
        await runtime.finalize();
    }

    // Runs the loop that keeps the game alive, i.e. continues to fire timers and microtasks in a
    // deterministic manner to match what would happen in a production environment.
    async function runGameLoop() {
        for (let tick = 0; tick <= 2; ++tick) {
            await server.clock.advance(kDefaultTickIntervalMs);
            for (let i = 0; i < 5; ++i)
                await Promise.resolve();
        }
    }

    it('should serialize and later on restore participant states', async (assert) => {
        const description = new GameDescription(Game, { name: 'Bubble' });
        const runtime = new GameRuntime(manager, description);

        await runtime.initialize();

        await runtime.addPlayer(gunther);
        assert.isTrue(gunther.hasBeenSerializedForTesting);

        const game = runtime.run();

        await runtime.removePlayer(gunther);
        assert.isFalse(gunther.hasBeenSerializedForTesting);

        await Promise.all([ game, runGameLoop() ]);
    });

    it('should call the Game events in order', async (assert) => {
        const events = [];
        const description = new GameDescription(class extends Game {
            async onInitialized() { events.push('onInitialized'); }
            async onPlayerAdded(player) { events.push('onPlayerAdded'); }
            async onPlayerSpawned(player) { events.push('onPlayerSpawned'); }
            async onTick() { events.push('onTick'); await this.stop(); }
            async onPlayerRemoved(player) { events.push('onPlayerRemoved'); }
            async onFinished() { events.push('onFinished'); }

        }, { name: 'Bubble' });

        const game = runGame(description, [ gunther, russell ]);
        await runGameLoop();

        assert.deepEqual(events, [
            'onInitialized',
            'onPlayerAdded',
            'onPlayerSpawned',
            'onPlayerAdded',
            'onPlayerSpawned',
            'onTick',
            'onPlayerRemoved',
            'onPlayerRemoved',
            'onFinished',
        ]);

        await game;  // make sure that the game has finished
    });

    it('should have a sensible description when casted to a string', assert => {
        const description = new GameDescription(Game, { name: 'Bubble' });
        const runtime = new GameRuntime(manager, description);

        assert.equal(String(runtime), '[GameActivity: Bubble (engaged)]');
    });
});
