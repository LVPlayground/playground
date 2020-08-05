// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { ContinuousObjective } from 'features/games_deathmatch/objectives/continuous_objective.js';
import { DeathmatchGame } from 'features/games_deathmatch/deathmatch_game.js';

import { getGameInstance, runGameLoop } from 'features/games/game_test_helpers.js';

describe('ContinuousObjective', it => {
    const kObjectiveIndex = 5;
    const kObjectiveContinuousIndex = 2;

    it('should be possible to have continuously running games', async (assert) => {
        const feature = server.featureManager.loadFeature('games_deathmatch');
        const settings = server.featureManager.loadFeature('settings');

        const gunther = server.playerManager.getById(/* Gunther= */ 0);
        const russell = server.playerManager.getById(/* Russell= */ 1);

        class BubbleGame extends DeathmatchGame {}

        feature.registerGame(BubbleGame, {
            name: 'Bubble Fighting',
            goal: 'Fight each other with bubbles',

            command: 'bubble',
            price: 0,

            minimumPlayers: 1,
            maximumPlayers: 4,
        });

        // Mimic the flow where the game's objective is decided by the player through the menu,
        // which is what will get least in-game coverage when doing manual testing.
        gunther.respondToDialog({ listitem: kObjectiveIndex }).then(
            () => gunther.respondToDialog({ listitem: kObjectiveContinuousIndex })).then(
            () => gunther.respondToDialog({ listitem: 0 /* start the game */ }));

        assert.isTrue(await gunther.issueCommand('/bubble custom'));
        assert.isTrue(await russell.issueCommand('/bubble'));

        await server.clock.advance(settings.getValue('games/registration_expiration_sec') * 1000);
        await runGameLoop();  // fully initialize the game

        // Verify that the appropriate objective was loaded as part of the game.
        assert.doesNotThrow(() => getGameInstance());
        assert.instanceOf(getGameInstance().objectiveForTesting, ContinuousObjective);

        // Have both Gunther and Russell die, disconnect Gunther leaving Russell on their own - it
        // does not matter. The game should not stop until Russell types the "/leave" command.
        gunther.die();
        russell.die();

        await runGameLoop();  // give the game a chance to end if it would

        assert.doesNotThrow(() => getGameInstance());

        gunther.disconnectForTesting();
        await runGameLoop();  // give the game a chance to end if it would

        assert.doesNotThrow(() => getGameInstance());
        assert.isTrue(await russell.issueCommand('/leave'));

        await runGameLoop();  // give the game a chance to end, which it now should

        assert.throws(() => getGameInstance());
    });
});
