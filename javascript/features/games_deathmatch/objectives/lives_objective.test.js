// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { DeathmatchGame } from 'features/games_deathmatch/deathmatch_game.js';
import { LivesObjective } from 'features/games_deathmatch/objectives/lives_objective.js';

import { getGameInstance, runGameLoop } from 'features/games/game_test_helpers.js';

describe('LivesObjective', it => {
    const kObjectiveIndex = 5;
    const kObjectiveLivesIndex = 0;

    it('should be possible to have games with a number of lives', async (assert) => {
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
            () => gunther.respondToDialog({ listitem: kObjectiveLivesIndex })).then(
            () => gunther.respondToDialog({ inputtext: '2' /* lives */ })).then(
            () => gunther.respondToDialog({ listitem: 0 /* start the game */ }));

        assert.isTrue(await gunther.issueCommand('/bubble custom'));
        assert.isTrue(await russell.issueCommand('/bubble'));

        await server.clock.advance(settings.getValue('games/registration_expiration_sec') * 1000);
        await runGameLoop();  // fully initialize the game

        // Verify that the appropriate objective was loaded as part of the game.
        assert.doesNotThrow(() => getGameInstance());
        assert.instanceOf(getGameInstance().objectiveForTesting, LivesObjective);

        // The game ends when either Russell or Gunther dies twice. We kill Gunther first.
        gunther.die();

        await runGameLoop();  // allow the game to finish, if it would.
        assert.doesNotThrow(() => getGameInstance());

        // Kill Russell, after which the game will be in sudden death mode.
        russell.die();

        await runGameLoop();  // allow the game to finish, if it would.
        assert.doesNotThrow(() => getGameInstance());

        // Now kill Gunther again. This will mark Russell as the winner of the match.
        gunther.die();

        await runGameLoop();  // allow the game to finish
        assert.throws(() => getGameInstance());
    });
});
