// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { DeathmatchGame } from 'features/games_deathmatch/deathmatch_game.js';

import { kDefaultTickIntervalMs } from 'features/games/game_description.js';

describe('GamesDeathmatch', (it, beforeEach) => {
    let feature = null;
    let gunther = null;
    let settings = null;

    beforeEach(() => {
        feature = server.featureManager.loadFeature('games_deathmatch');
        gunther = server.playerManager.getById(/* Gunther= */ 0);
        settings = server.featureManager.loadFeature('settings');
    });

    // Runs the loop that keeps the game alive, i.e. continues to fire timers and microtasks in a
    // deterministic manner to match what would happen in a production environment.
    async function runGameLoop() {
        for (let tick = 0; tick <= 2; ++tick) {
            await server.clock.advance(kDefaultTickIntervalMs);
            for (let i = 0; i < 5; ++i)
                await Promise.resolve();
        }
    }

    // Indices for the automatically inserted options in the customization menu.
    const kStartGameIndex = 0;
    const kLagCompensationIndex = 2;

    it('automatically re-registers games when the Games feature reloads', async (assert) => {
        class BubbleGame extends DeathmatchGame {}

        assert.isFalse(server.commandManager.hasCommand('bubble'));

        feature.registerGame(BubbleGame, {
            name: 'Bubble Fighting Game',
            goal: 'Fight each other with bubbles',
            command: 'bubble',
        });

        assert.isTrue(server.commandManager.hasCommand('bubble'));

        await server.featureManager.liveReload('games');

        assert.isTrue(server.commandManager.hasCommand('bubble'));
    });

    it('should be able to change lag compensation mode for a game', async (assert) => {
        class BubbleGame extends DeathmatchGame {}

        feature.registerGame(BubbleGame, {
            name: 'Bubble Fighting Game',
            goal: 'Fight each other with bubbles',

            command: 'bubble',
            continuous: true,
            price: 0,

            lagCompensation: false,

            minimumPlayers: 1,
            maximumPlayers: 4,
        });

        assert.equal(gunther.syncedData.lagCompensationMode, Player.kDefaultLagCompensationMode);

        assert.isTrue(await gunther.issueCommand('/bubble'));
        assert.equal(gunther.syncedData.minigameName, 'Bubble Fighting Game');

        await runGameLoop();

        assert.equal(gunther.syncedData.lagCompensationMode, /* lag shot= */ 0);

        assert.isTrue(await gunther.issueCommand('/leave'));
        assert.equal(gunther.syncedData.minigameName, '');

        assert.equal(gunther.syncedData.lagCompensationMode, Player.kDefaultLagCompensationMode);
    });

    it('should enable players to customise the settings', async (assert) => {
        class BubbleGame extends DeathmatchGame {}

        feature.registerGame(BubbleGame, {
            name: 'Bubble Fighting Game',
            goal: 'Fight each other with bubbles',

            command: 'bubble',
            continuous: true,
            price: 0,

            lagCompensation: false,

            minimumPlayers: 1,
            maximumPlayers: 4,
        });

        assert.equal(gunther.syncedData.lagCompensationMode, Player.kDefaultLagCompensationMode);

        gunther.respondToDialog({ listitem: kLagCompensationIndex }).then(
            () => gunther.respondToDialog({ listitem: 0 /* enabled */ })).then(
            () => gunther.respondToDialog({ listitem: kStartGameIndex }));

        assert.isTrue(await gunther.issueCommand('/bubble custom'));
        assert.equal(gunther.syncedData.minigameName, 'Bubble Fighting Game');

        await runGameLoop();

        // Overridden from the default through the customization menu:
        assert.equal(gunther.syncedData.lagCompensationMode, Player.kDefaultLagCompensationMode);

        assert.isTrue(await gunther.issueCommand('/leave'));
        assert.equal(gunther.syncedData.minigameName, '');

        assert.equal(gunther.syncedData.lagCompensationMode, Player.kDefaultLagCompensationMode);
    });
});
