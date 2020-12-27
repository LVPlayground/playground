// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { getGameInstance, runGameLoop } from 'features/games/game_test_helpers.js';

describe('DerbyCommands', (it, beforeEach) => {
    let gunther = null;
    let lucy = null;
    let russell = null;
    let settings = null;

    beforeEach(() => {
        server.featureManager.loadFeature('derbies');

        gunther = server.playerManager.getById(/* Gunther= */ 0);
        lucy = server.playerManager.getById(/* Lucy= */ 2);
        russell = server.playerManager.getById(/* Russell= */ 1);
        settings = server.featureManager.loadFeature('settings');
    });

    it('should be able to list all available derbies', async (assert) => {
        assert.isTrue(server.commandManager.hasCommand('derby'));

        gunther.respondToDialog({ response: 0 /* dismiss */ });

        assert.isTrue(await gunther.issueCommand('/derby'));
        assert.includes(gunther.lastDialog, 'Monster Truck');
    });

    it('should enable players to start or watch a derby through the commands', async (assert) => {
        assert.isTrue(server.commandManager.hasCommand('derby'));

        // Have |gunther| start the Monster Truck derby by its ID, and have |russell| join.
        assert.isTrue(await gunther.issueCommand('/derby 1'));
        assert.isTrue(await russell.issueCommand('/derby 1'));
        assert.throws(() => getGameInstance());

        await server.clock.advance(settings.getValue('games/registration_expiration_sec') * 1000);
        await runGameLoop();

        // The game should have been started as the registration timeout finished.
        assert.doesNotThrow(() => getGameInstance());
        const game = getGameInstance();

        assert.isTrue(game.players.has(gunther));

        // Lucy now is interested in watching the derby. Have them use the watch command.
        assert.isFalse(lucy.spectatingForTesting);

        assert.isTrue(await lucy.issueCommand('/derby watch'));
        assert.isTrue(lucy.spectatingForTesting);

        // Have |gunther| leave the derby by using the canonical "/leave" command.
        assert.isTrue(await gunther.issueCommand('/leave'));

        // TODO: The game should automatically end.
        assert.isTrue(await russell.issueCommand('/leave'));

        await runGameLoop();  // give the derby a chance to end

        assert.throws(() => getGameInstance());
        assert.isFalse(game.players.has(gunther));
        assert.isFalse(lucy.spectatingForTesting);
    });
});
