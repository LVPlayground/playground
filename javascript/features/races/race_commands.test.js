// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { StartCountdown } from 'features/games_vehicles/interface/start_countdown.js';

import { getGameInstance, runGameLoop } from 'features/games/game_test_helpers.js';
import { kStartCountdownSeconds } from 'features/races/race_game.js';

describe('RaceCommands', (it, beforeEach) => {
    let gunther = null;
    let russell = null;
    let settings = null;

    beforeEach(() => {
        server.featureManager.loadFeature('races');

        gunther = server.playerManager.getById(/* Gunther= */ 0);
        russell = server.playerManager.getById(/* Russell= */ 1);
        settings = server.featureManager.loadFeature('settings');
    });

    it('should be able to list all available races', async (assert) => {
        assert.isTrue(server.commandManager.hasCommand('race'));

        await gunther.identify();

        gunther.respondToDialog({ response: 0 /* dismiss */ });

        assert.isTrue(await gunther.issueCommand('/race'));

        // Verify that the race names are included in the dialog.
        assert.includes(gunther.lastDialog, 'Coastal Conduit');
        assert.includes(gunther.lastDialog, 'Los Santos Blown Bikes');

        // Verify that global high scores are included.
        assert.includes(gunther.lastDialog, '02:03 (Badeend)');
        assert.includes(gunther.lastDialog, '03:54 ({FF1493}Lithirm{FFFFFF})');

        // Verify that personal high scores are included.
        assert.includes(gunther.lastDialog, '02:08');
    });

    it('should enable players to start or watch a race through the commands', async (assert) => {
        assert.isTrue(server.commandManager.hasCommand('race'));

        // Have |gunther| start the Coastal Conduit race by its ID.
        assert.isTrue(await gunther.issueCommand('/race 1'));
        assert.throws(() => getGameInstance());

        await server.clock.advance(settings.getValue('games/registration_expiration_sec') * 1000);
        await runGameLoop();

        // The game should have been started as the registration timeout finished.
        assert.doesNotThrow(() => getGameInstance());
        const game = getGameInstance();

        assert.isTrue(game.players.has(gunther));

        // Advance past the countdown, so that all participants will have fully spawned.
        await StartCountdown.advanceCountdownForTesting(kStartCountdownSeconds);

        // Russell now is interested in watching the race. Have them use the watch command.
        assert.isFalse(russell.spectatingForTesting);

        assert.isTrue(await russell.issueCommand('/race watch'));
        assert.isTrue(russell.spectatingForTesting);

        // Have |gunther| leave the race by using the canonical "/leave" command.
        assert.isTrue(await gunther.issueCommand('/leave'));

        await runGameLoop();  // give the race a chance to end

        assert.throws(() => getGameInstance());
        assert.isFalse(game.players.has(gunther));
        assert.isFalse(russell.spectatingForTesting);
    });
});
