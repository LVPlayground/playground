// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Countdown } from 'features/games_vehicles/interface/countdown.js';

import { getGameInstance, runGameLoop } from 'features/games/game_test_helpers.js';

import { kCountdownSeconds } from 'features/derbies/derby_game.js';
import { kInitialSpawnLoadDelayMs } from 'features/games_vehicles/vehicle_game.js';

describe('DerbyGame', (it, beforeEach) => {
    let gunther = null;
    let registry = null;
    let russell = null;
    let settings = null;

    beforeEach(() => {
        const feature = server.featureManager.loadFeature('derbies');

        gunther = server.playerManager.getById(/* Gunther= */ 0);
        registry = feature.registry_;
        russell = server.playerManager.getById(/* Russell= */ 1);
        settings = server.featureManager.loadFeature('settings');
    });

    // Helper function to set the given |description| for the first derby game. Should be called by
    // every test, even when not changing the settings, to avoid disk access during the run.
    function installDescription(description = {}) {
        registry.setDescriptionForTesting(/* Game ID: */ 1, Object.assign({
            id: 1,
            environment: {
                gravity: 'Normal',
                interiorId: 0,
                time: 'Afternoon',
                weather: 'Sunny',
            },
            settings: {},
            spawnPositions: [
                {
                    position: new Vector(0, 0, 0),
                    facingAngle: 0,
                    vehicleModelId: 411,
                },
                {
                    position: new Vector(10, 10, 10),
                    facingAngle: 90,
                    vehicleModelId: 411,
                },
            ],

            objects: [],
            pickups: [],

        }, description));
    }

    it('should keep players frozen until the countdown finishes', async (assert) => {
        installDescription(/* default description */);

        assert.isTrue(await gunther.issueCommand('/derby 1'));
        assert.isTrue(await russell.issueCommand('/derby 1'));

        await server.clock.advance(settings.getValue('games/registration_expiration_sec') * 1000);
        await runGameLoop();

        assert.doesNotThrow(() => getGameInstance());

        // (1) The game has been initialized, and is waiting for the environment to load.
        assert.isFalse(gunther.controllableForTesting);
        assert.isFalse(russell.controllableForTesting);

        await server.clock.advance(kInitialSpawnLoadDelayMs);

        // (2) Vehicles have been created, the players may or may not be in them yet. The Derby
        // feature will now turn off the vehicle's engines to prevent the players from starting.
        assert.isTrue(gunther.controllableForTesting);

        assert.isNotNull(gunther.vehicle);
        assert.isFalse(gunther.vehicle.engineForTesting);

        assert.isTrue(russell.controllableForTesting);

        assert.isNotNull(russell.vehicle);
        assert.isFalse(russell.vehicle.engineForTesting);

        // (3) The countdown has started. We need to wait for it to pass.
        await Countdown.advanceCountdownForTesting(kCountdownSeconds);

        // (4) Now the vehicles of |gunther| and |russell| should be unlocked. Off they go!
        assert.isNotNull(gunther.vehicle);
        assert.isTrue(gunther.vehicle.engineForTesting);

        assert.isNotNull(russell.vehicle);
        assert.isTrue(russell.vehicle.engineForTesting);

        // Have |gunther| and |russell| leave the game, to wind it down gracefully.
        assert.isTrue(await gunther.issueCommand('/leave'));
        assert.isTrue(await russell.issueCommand('/leave'));

        await runGameLoop();

        assert.throws(() => getGameInstance());
    });

    it('should be able to make people invisible on the map', async (assert) => {
        installDescription({
            settings: {
                invisible: true,
            }
        });

        assert.isTrue(gunther.colors.visible);
        assert.isTrue(await gunther.issueCommand('/derby 1'));
        assert.isTrue(await russell.issueCommand('/derby 1'));

        await server.clock.advance(settings.getValue('games/registration_expiration_sec') * 1000);
        await runGameLoop();

        assert.doesNotThrow(() => getGameInstance());

        // Verify that |gunther| has been made invisible.
        assert.isFalse(gunther.colors.visible);

        // Have |gunther| and |russell| leave the game, to wind it down gracefully.
        assert.isTrue(await gunther.issueCommand('/leave'));
        assert.isTrue(await russell.issueCommand('/leave'));

        await runGameLoop();

        assert.throws(() => getGameInstance());
        assert.isTrue(gunther.colors.visible);
    });

    it('should kick people out when they have left their vehicle', async (assert) => {
        installDescription(/* default description */);

        assert.isTrue(await gunther.issueCommand('/derby 1'));
        assert.isTrue(await russell.issueCommand('/derby 1'));

        await server.clock.advance(settings.getValue('games/registration_expiration_sec') * 1000);
        await runGameLoop();

        const game = getGameInstance();

        // Wait past the frozen stage as well as the countdown.
        await server.clock.advance(kInitialSpawnLoadDelayMs);
        await Countdown.advanceCountdownForTesting(kCountdownSeconds);

        assert.isTrue(game.players.has(gunther));
        assert.isTrue(game.players.has(russell));

        // Russell now leaves their vehicle. They should be dropped out of the game.
        russell.vehicle = null;

        // What happens now is that |russell| will be marked as the loser, which leaves |gunther| as
        // the only participant, who will thus be marked as the winner.
        await runGameLoop();

        assert.isFalse(game.players.has(gunther));
        assert.isFalse(game.players.has(russell));

        assert.equal(gunther.messages.length, 3);
        assert.includes(gunther.messages[2], '1st');

        assert.equal(russell.messages.length, 3);
        assert.includes(russell.messages[2], '2nd');

        // Verify that the derby has indeed been shut down in its entirety.
        assert.throws(() => getGameInstance());
    });

});
