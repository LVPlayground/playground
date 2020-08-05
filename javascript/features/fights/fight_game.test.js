// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { getGameInstance, runGameLoop } from 'features/games/game_test_helpers.js';

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

    it('should be able to run a full fight based on a custom command', async (assert) => {
        assert.isTrue(server.commandManager.hasCommand('sniper'));

        assert.isTrue(await gunther.issueCommand('/sniper'));
        assert.isTrue(await russell.issueCommand('/sniper'));

        await server.clock.advance(settings.getValue('games/registration_expiration_sec') * 1000);
        await runGameLoop();

        // The game instance should have been created by now.
        const game = getGameInstance();

        assert.equal(game.players.size, 2);
        assert.isTrue(game.players.has(gunther));
        assert.isTrue(game.players.has(russell));

        // Have Gunther kill Russell. This should end the game immediately.
        russell.die(/* killerPlayer= */ gunther, /* reason= */ 34);

        await runGameLoop();

        assert.throws(() => getGameInstance());
    });
});
