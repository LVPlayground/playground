// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Countdown } from 'features/games_vehicles/interface/countdown.js';
import { Vehicle } from 'entities/vehicle.js';

import { getGameInstance, runGameLoop } from 'features/games/game_test_helpers.js';

import { kCountdownSeconds,
         kNitrousInjectionIssueTimeMs,
         kVehicleDamageRepairTimeMs } from 'features/races/race_game.js';
import { kInitialSpawnLoadDelayMs } from 'features/games_vehicles/vehicle_game.js';

describe('RaceGame', (it, beforeEach) => {
    let gunther = null;
    let registry = null;
    let russell = null;
    let settings = null;

    beforeEach(() => {
        const feature = server.featureManager.loadFeature('races');

        gunther = server.playerManager.getById(/* Gunther= */ 0);
        registry = feature.registry_;
        russell = server.playerManager.getById(/* Russell= */ 1);
        settings = server.featureManager.loadFeature('settings');
    });

    // Helper function to set the given |description| for the first race game. Should be called by
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
        installDescription( /* default description */);

        assert.isTrue(await gunther.issueCommand('/race 1'));
        assert.isTrue(await russell.issueCommand('/race 1'));

        await server.clock.advance(settings.getValue('games/registration_expiration_sec') * 1000);
        await runGameLoop();

        assert.doesNotThrow(() => getGameInstance());

        // (1) The game has been initialized, and is waiting for the environment to load.
        assert.isFalse(gunther.controllableForTesting);
        assert.isFalse(russell.controllableForTesting);

        await server.clock.advance(kInitialSpawnLoadDelayMs);

        // (2) Vehicles have been created, the players may or may not be in them yet. The Race
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

    it('should be able to issue one-off nitrous injection to vehicles', async (assert) => {
        installDescription({
            settings: {
                nos: 5,
            }
        });

        assert.isTrue(await gunther.issueCommand('/race 1'));

        await server.clock.advance(settings.getValue('games/registration_expiration_sec') * 1000);
        await runGameLoop();

        assert.doesNotThrow(() => getGameInstance());

        // Forward to the moment the countdown has ended, and |gunther| is able to start racing.
        await server.clock.advance(kInitialSpawnLoadDelayMs);
        await Countdown.advanceCountdownForTesting(kCountdownSeconds);

        assert.isNotNull(gunther.vehicle);

        // Verify that |gunther|'s vehicle has been given nitrous injection.
        assert.equal(gunther.vehicle.getComponentInSlot(Vehicle.kComponentSlotNitro), 1008);

        // Have |gunther| leave the game, to wind it down gracefully.
        assert.isTrue(await gunther.issueCommand('/leave'));

        await runGameLoop();

        assert.throws(() => getGameInstance());
    });

    it('should be able to issue infinite nitrous injection to vehicles', async (assert) => {
        installDescription({
            settings: {
                unlimitedNos: true,
            }
        });

        assert.isTrue(await gunther.issueCommand('/race 1'));

        await server.clock.advance(settings.getValue('games/registration_expiration_sec') * 1000);
        await runGameLoop();

        assert.doesNotThrow(() => getGameInstance());

        // Forward to the moment the countdown has ended, and |gunther| is able to start racing.
        await server.clock.advance(kInitialSpawnLoadDelayMs);
        await Countdown.advanceCountdownForTesting(kCountdownSeconds);

        assert.isNotNull(gunther.vehicle);

        // Verify that |gunther|'s vehicle has been given nitrous injection.
        assert.equal(gunther.vehicle.getComponentInSlot(Vehicle.kComponentSlotNitro), 1009);

        // Verify that the nitrous injection will be re-issued after a predetermined amount of time.
        gunther.vehicle.removeComponent(1009);

        await server.clock.advance(kNitrousInjectionIssueTimeMs);
        await runGameLoop();

        assert.equal(gunther.vehicle.getComponentInSlot(Vehicle.kComponentSlotNitro), 1009);

        // Have |gunther| leave the game, to wind it down gracefully.
        assert.isTrue(await gunther.issueCommand('/leave'));

        await runGameLoop();

        assert.throws(() => getGameInstance());
    });

    it('should be able to give vehicles infinite health', async (assert) => {
        installDescription({
            settings: {
                disableVehicleDamage: true,
            }
        });

        assert.isTrue(await gunther.issueCommand('/race 1'));

        await server.clock.advance(settings.getValue('games/registration_expiration_sec') * 1000);
        await runGameLoop();

        assert.doesNotThrow(() => getGameInstance());

        // Forward to the moment the countdown has ended, and |gunther| is able to start racing.
        await server.clock.advance(kInitialSpawnLoadDelayMs);
        await Countdown.advanceCountdownForTesting(kCountdownSeconds);

        assert.isNotNull(gunther.vehicle);
        assert.equal(gunther.vehicle.health, 1000);

        // Reduce the health of |gunther|'s vehicle, then expect it to be repaired shortly after.
        gunther.vehicle.health = 800;

        await server.clock.advance(kVehicleDamageRepairTimeMs);
        await runGameLoop();

        assert.isNotNull(gunther.vehicle);
        assert.equal(gunther.vehicle.health, 1000);

        // Have |gunther| leave the game, to wind it down gracefully.
        assert.isTrue(await gunther.issueCommand('/leave'));

        await runGameLoop();

        assert.throws(() => getGameInstance());
    });
});
