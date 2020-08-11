// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Setting } from 'entities/setting.js';
import { Vector } from 'base/vector.js';
import { VehicleGame, kInitialSpawnLoadDelayMs } from 'features/games_vehicles/vehicle_game.js';
import { VehicleGameRegistry } from 'features/games_vehicles/vehicle_game_registry.js';

import { getGameInstance, runGameLoop } from 'features/games/game_test_helpers.js';

describe('GamesVehicles', (it, beforeEach) => {
    let feature = null;
    let gunther = null;
    let registry = null;
    let russell = null;
    let settings = null;

    beforeEach(() => {
        feature = server.featureManager.loadFeature('games_vehicles');

        gunther = server.playerManager.getById(/* Gunther= */ 0);
        registry = new VehicleGameRegistry('games', /* directory= */ null, VehicleGame);
        russell = server.playerManager.getById(/* Russell= */ 1);
        settings = server.featureManager.loadFeature('settings');
    });

    // Description ID that will be used while running tests.
    const kTestingDescriptionId = 1;

    // Creates a vehicle game with the given |name| that is fit for use by tests in this suite.
    function createVehicleGame(name, command, gameConstructor, description = {}) {
        feature.registerGame(gameConstructor, {
            name, command,
            goal: 'Game intended for testing functionality.',

            minimumPlayers: 1,
            maximumPlayers: 4,
            price: 0,

            settings: [
                // Game Description ID (number)
                new Setting(
                    'game', 'description_id', Setting.TYPE_NUMBER, kTestingDescriptionId,
                    'Description ID'),
            ],

        }, registry);

        registry.setDescriptionForTesting(kTestingDescriptionId, Object.assign({
            id: kTestingDescriptionId,
            environment: {
                interiorId: 0,
            },
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
                {
                    position: new Vector(20, 20, 20),
                    facingAngle: 190,
                    vehicleModelId: 411,
                },
                {
                    position: new Vector(30, 30, 30),
                    facingAngle: 270,
                    vehicleModelId: 411,
                },
            ],

            objects: [],
            pickups: [],

        }, description));
    }

    it('automatically re-registers games when the Games feature reloads', async (assert) => {
        assert.isFalse(server.commandManager.hasCommand('drive'));

        createVehicleGame('Driving Game', 'drive', VehicleGame);

        assert.isTrue(server.commandManager.hasCommand('drive'));

        await server.featureManager.liveReload('games');

        assert.isTrue(server.commandManager.hasCommand('drive'));
    });

    it('should be able to apply object and pickup settings', async (assert) => {
        createVehicleGame('Driving Game', 'drive', VehicleGame, {
            objects: [
                { modelId: 1225, position: new Vector(0, 0, 0), rotation: new Vector(0, 0, 0) },
                { modelId: 1225, position: new Vector(0, 0, 0), rotation: new Vector(0, 0, 0) },
            ],
            pickups: [
                { modelId: 1001, type: 12, position: new Vector(0, 0, 0) },
                { modelId: 1001, type: 14, position: new Vector(0, 0, 0) },
            ],
        });

        const originalObjectCount = server.objectManager.size;
        const originalPickupCount = server.pickupManager.size;

        assert.isTrue(server.commandManager.hasCommand('drive'));
        assert.isTrue(await gunther.issueCommand('/drive'));

        await server.clock.advance(settings.getValue('games/registration_expiration_sec') * 1000);
        await runGameLoop();

        const game = getGameInstance();

        assert.isTrue(game.players.has(gunther));

        // (1) Verify that the defined objects and pickups have been created.
        assert.equal(server.objectManager.size, originalObjectCount + 2);
        assert.equal(server.pickupManager.size, originalPickupCount + 2);

        // Have |gunther| leave the game, to wind it down gracefully.
        assert.isTrue(await gunther.issueCommand('/leave'));
        await runGameLoop();

        assert.throws(() => getGameInstance());

        // (2) The objects and pickups should've been removed again.
        assert.equal(server.objectManager.size, originalObjectCount);
        assert.equal(server.pickupManager.size, originalPickupCount);
    });

    it('should be able to safely spawn players in vehicles', async (assert) => {
        createVehicleGame('Driving Game', 'drive', VehicleGame);

        const originalVehicleCount = server.vehicleManager.size;

        assert.isTrue(server.commandManager.hasCommand('drive'));
        assert.isTrue(await gunther.issueCommand('/drive'));
        assert.isTrue(await russell.issueCommand('/drive'));

        await server.clock.advance(settings.getValue('games/registration_expiration_sec') * 1000);
        await runGameLoop();

        assert.doesNotThrow(() => getGameInstance());

        // (1) Neither |gunther| nor |russell| should be in a vehicle.
        assert.isNull(gunther.vehicle);
        assert.isNull(russell.vehicle);

        await server.clock.advance(kInitialSpawnLoadDelayMs);

        assert.equal(server.vehicleManager.size, originalVehicleCount + 2);

        assert.isNotNull(gunther.vehicle);
        assert.equal(gunther.vehicle.modelId, 411);

        assert.isNotNull(russell.vehicle);
        assert.equal(russell.vehicle.modelId, 411);

        assert.notDeepEqual(gunther.vehicle.position, russell.vehicle.position);

        // Have |gunther| and |russell| leave the game, to wind it down gracefully.
        assert.isTrue(await gunther.issueCommand('/leave'));
        assert.isTrue(await russell.issueCommand('/leave'));

        await runGameLoop();

        // (2) Verify that the created vehicles have been removed from the server again.
        assert.equal(server.vehicleManager.size, originalVehicleCount);
    });
});
