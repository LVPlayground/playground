// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { GameDescription } from 'features/games/game_description.js';
import { GameRegistration } from 'features/games/game_registration.js';
import { Game } from 'features/games/game.js';

describe('GameManager', (it, beforeEach) => {
    let gunther = null;
    let manager = null;
    let russell = null;

    // Example contribution amount that a player could play for a game.
    const kContribution = 2500;

    // Mock game that can be used by the individual tests.
    class BubbleGame extends Game {}

    beforeEach(() => {
        const feature = server.featureManager.loadFeature('games');

        manager = feature.manager_;

        gunther = server.playerManager.getById(/* Gunther= */ 0);
        russell = server.playerManager.getById(/* Russell= */ 1);
    });

    it('is able to cancel registrations when the game is being reloaded', assert => {
        const finance = server.featureManager.loadFeature('finance');

        const description = new GameDescription(BubbleGame, { name: 'Bubble', goal: '' });
        const registration =
            manager.createGameRegistration(description, new Map(), GameRegistration.kTypePublic);
        
        assert.isNull(manager.getPlayerActivity(gunther));
        assert.equal(gunther.syncedData.minigameName, '');

        registration.registerPlayer(gunther, kContribution);
        assert.equal(manager.getPlayerActivity(gunther), registration);
        assert.equal(gunther.syncedData.minigameName, 'Bubble');

        assert.equal(finance.getPlayerCash(gunther), 0);

        // This is the method that will be called by the GameRegistry in this scenario.
        manager.stopAllActiveGames(description);

        assert.isNull(manager.getPlayerActivity(gunther));
        assert.equal(gunther.syncedData.minigameName, '');

        assert.equal(gunther.messages.length, 1);
        assert.equal(
            gunther.messages[0], Message.format(Message.GAME_REGISTRATION_RELOAD, 'Bubble'));
        
        assert.isTrue(registration.hasFinished());

        // Their contribution should have been refunded.
        assert.equal(finance.getPlayerCash(gunther), kContribution);
    });

    it('is able to remove a player from a registration when they disconnect', assert => {
        const description = new GameDescription(BubbleGame, { name: 'Bubble', goal: '' });
        const registration =
            manager.createGameRegistration(description, new Map(), GameRegistration.kTypePublic);
        
        assert.isNull(manager.getPlayerActivity(gunther));

        registration.registerPlayer(gunther, kContribution);
        assert.equal(manager.getPlayerActivity(gunther), registration);

        // Disconnect |gunther| from the server.
        gunther.disconnectForTesting();

        assert.isTrue(registration.hasFinished());
        assert.isNull(manager.getPlayerActivity(gunther));
    });
});
