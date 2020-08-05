// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { DeathmatchGame } from 'features/games_deathmatch/deathmatch_game.js';
import { TimedObjective } from 'features/games_deathmatch/objectives/timed_objective.js';

import { getGameInstance, runGameLoop } from 'features/games/game_test_helpers.js';

describe('TimedObjective', it => {
    const kObjectiveIndex = 5;
    const kObjectiveTimeLimitIndex = 1;

    it('should be possible to have games with a time limit', async (assert) => {
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
            () => gunther.respondToDialog({ listitem: kObjectiveTimeLimitIndex })).then(
            () => gunther.respondToDialog({ inputtext: '180' /* seconds */ })).then(
            () => gunther.respondToDialog({ listitem: 0 /* start the game */ }));

        assert.isTrue(await gunther.issueCommand('/bubble custom'));
        assert.isTrue(await russell.issueCommand('/bubble'));

        await server.clock.advance(settings.getValue('games/registration_expiration_sec') * 1000);
        await runGameLoop();  // fully initialize the game

        // Verify that the appropriate objective was loaded as part of the game.
        assert.doesNotThrow(() => getGameInstance());
        assert.instanceOf(getGameInstance().objectiveForTesting, TimedObjective);

        // Both Gunther and Russell can die as they please, it should not matter. The game will end
        // when the timer reaches zero. (Or one of them leaves, but that case is tested elsewhere.)
        gunther.die();
        russell.die();

        await runGameLoop();  // give the game a chance to end if it would

        assert.doesNotThrow(() => getGameInstance());

        await server.clock.advance(180 * 1000);  // wait for the entire duration of the game
        await runGameLoop();  // allow the game to finish

        assert.throws(() => getGameInstance());
    });
});
