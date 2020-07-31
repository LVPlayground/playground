// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { kDefaultTickIntervalMs } from 'features/games/game_description.js';

describe('FightGame', (it, beforeEach) => {
    let games = null;
    let gunther = null;
    let russell = null;
    let settings = null;

    beforeEach(async () => {
        const feature = server.featureManager.loadFeature('fights');
        const finance = server.featureManager.loadFeature('finance');

        games = server.featureManager.loadFeature('games');
        gunther = server.playerManager.getById(/* Gunther= */ 0);
        russell = server.playerManager.getById(/* Russell= */ 1);
        settings = server.featureManager.loadFeature('settings');

        // Give both Gunther and Russell enough money to start a game.
        finance.givePlayerCash(gunther, 1000000);
        finance.givePlayerCash(russell, 1000000);

        // Wait until the settings have been loaded, which the feature depends on.
        await settings.ready;
    });

    // Returns the Game instance of the currently running game. When there are multiple games live
    // on the server, only the first will be returned.
    function getGameInstance() {
        if (!games.manager_.runtimes_.size)
            throw new Error('There currently are no running games on the server.');

        // Return the Game instance, which is what this layer cares about.
        return [ ...games.manager_.runtimes_ ][0].game_;
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

    // Indices for various options in the customisation menu.
    const kTeamsIndex = 11;

    it('should be able to pick random spawn positions in individual games', async (assert) => {
        assert.isTrue(server.commandManager.hasCommand('match'));

        gunther.respondToDialog({ listitem: 0 /* Start the game! */ });

        assert.isTrue(await gunther.issueCommand('/match'));
        assert.isTrue(await russell.issueCommand('/match'));

        await server.clock.advance(settings.getValue('games/registration_expiration_sec') * 1000);
        await runGameLoop();

        assert.doesNotThrow(() => getGameInstance());

        // Gunther and Russell should have been assigned different spawn positions.
        assert.notDeepEqual(gunther.position, russell.position);

        assert.isTrue(await gunther.issueCommand('/leave'));
        assert.isTrue(await russell.issueCommand('/leave'));

        await runGameLoop();

        // Verify that the Game instance has been destroyed, together with all supporting infra.
        assert.throws(() => getGameInstance());
    });

    it('should be able to pick random spawn positions in team-based games', async (assert) => {
        assert.isTrue(server.commandManager.hasCommand('match'));

        // Have Gunther set up a custom sniper game in which teams will be used.
        gunther.respondToDialog({ listitem: kTeamsIndex }).then(
            () => gunther.respondToDialog({ listitem: 0 /* balanced teams */ })).then(
            () => gunther.respondToDialog({ listitem: 0 /* start the game */ }));

        assert.isTrue(await gunther.issueCommand('/match custom'));
        assert.isTrue(await russell.issueCommand('/match'));

        await server.clock.advance(settings.getValue('games/registration_expiration_sec') * 1000);
        await runGameLoop();

        assert.doesNotThrow(() => getGameInstance());

        // Gunther and Russell should have been assigned different spawn positions.
        assert.notDeepEqual(gunther.position, russell.position);

        assert.isTrue(await gunther.issueCommand('/leave'));
        assert.isTrue(await russell.issueCommand('/leave'));

        await runGameLoop();

        // Verify that the Game instance has been destroyed, together with all supporting infra.
        assert.throws(() => getGameInstance());
    });
});
