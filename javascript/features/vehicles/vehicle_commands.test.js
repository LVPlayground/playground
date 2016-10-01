// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const MockAnnounce = require('features/announce/test/mock_announce.js');
const MockPlayground = require('features/playground/test/mock_playground.js');
const Streamer = require('features/streamer/streamer.js');
const VehicleManager = require('features/vehicles/vehicle_manager.js');
const Vehicles = require('features/vehicles/vehicles.js');

describe('VehicleCommands', (it, beforeEach) => {
    let commands = null;
    let gunther = null;
    let manager = null;

    beforeEach(async(assert) => {
        gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.identify();

        server.featureManager.registerFeaturesForTests({
            announce: MockAnnounce,
            playground: MockPlayground,
            streamer: Streamer,
            vehicles: Vehicles
        });

        const vehicles = server.featureManager.loadFeature('vehicles');
        const playground = server.featureManager.loadFeature('playground');

        playground.access.addException('v', gunther);

        commands = vehicles.commands_;
        manager = vehicles.manager_;
        await manager.ready;
    });

    // Creates a vehicle for |player| having the |modelId| and has him enter the vehicle.
    function createVehicleForPlayer(player, { modelId = 411 /* Infernus */, position = null } = {}) {
        const vehicle = manager.createVehicle({
            modelId: modelId,
            position: position || player.position,
            rotation: player.rotation,
            interiorId: player.interiorId,
            virtualWorld: player.virtualWorld
        });

        if (!vehicle)
            return false;

        player.enterVehicle(vehicle, Vehicle.SEAT_DRIVER);
        return player.vehicle === vehicle;
    }

    // TODO: We'll actually want to make this available to all the players.
    // See the following issue: https://github.com/LVPlayground/playground/issues/330
    it('should limit /v to administrators only', async(assert) => {
        const russell = server.playerManager.getById(1 /* Russell */);
        assert.equal(russell.level, Player.LEVEL_PLAYER);

        assert.isTrue(await russell.issueCommand('/v'));
        assert.equal(russell.messages.length, 1);
        assert.equal(russell.messages[0],
                     Message.format(Message.COMMAND_ERROR_INSUFFICIENT_RIGHTS, 'specific players'));
    });

    it('should not yet support the vehicle chooser dialog', async(assert) => {
        assert.isTrue(await gunther.issueCommand('/v'));
        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.COMMAND_UNSUPPORTED);
    });

    it('should support spawning vehicles by their model Id', async(assert) => {
        for (const invalidModel of ['-15', '42', '399', '612', '1337']) {
            assert.isTrue(await gunther.issueCommand('/v ' + invalidModel));
            assert.equal(gunther.messages.length, 1);
            assert.equal(
                gunther.messages[0], Message.format(Message.VEHICLE_SPAWN_NOT_FOUND, invalidModel));

            gunther.clearMessages();
        }

        const commandPromise = gunther.issueCommand('/v 520');

        await Promise.resolve();  // to trigger the command
        await server.clock.advance(350);  // to enter the vehicle
        await commandPromise;

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.format(Message.VEHICLE_SPAWN_CREATED, 'Hydra'));

        assert.isNotNull(gunther.vehicle);
        assert.equal(gunther.vehicle.modelId, 520 /* Hydra */);
    });

    it('should support spawning vehicles by their model name', async(assert) => {
        for (const invalidModel of ['fish', 'banana', 'tweezers', 'dirtbike', 'redness']) {
            assert.isTrue(await gunther.issueCommand('/v ' + invalidModel));
            assert.equal(gunther.messages.length, 1);
            assert.equal(
                gunther.messages[0], Message.format(Message.VEHICLE_SPAWN_NOT_FOUND, invalidModel));

            gunther.clearMessages();
        }

        const commandPromise = gunther.issueCommand('/v Hydra');

        await Promise.resolve();  // to trigger the command
        await server.clock.advance(350);  // to enter the vehicle
        await commandPromise;

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.format(Message.VEHICLE_SPAWN_CREATED, 'Hydra'));

        assert.isNotNull(gunther.vehicle);
        assert.equal(gunther.vehicle.modelId, 520 /* Hydra */);
    });

    it('should be able to delete the vehicle the admin is driving in', async(assert) => {
        // Only administrators can delete vehicles from the server.
        gunther.level = Player.LEVEL_ADMINISTRATOR;

        assert.isTrue(createVehicleForPlayer(gunther));

        const vehicle = gunther.vehicle;
        assert.isNotNull(vehicle);
        assert.isTrue(vehicle.isConnected());

        assert.isTrue(await gunther.issueCommand('/v delete'));

        assert.isNull(gunther.vehicle);
        assert.isFalse(vehicle.isConnected());
    });

    it('should be able to delete the vehicle other players are driving in', async(assert) => {
        const russell = server.playerManager.getById(1 /* Russell */);

        // Only administrators can delete vehicles from the server.
        gunther.level = Player.LEVEL_ADMINISTRATOR;

        assert.isTrue(createVehicleForPlayer(russell));

        const vehicle = russell.vehicle;
        assert.isNotNull(vehicle);
        assert.isTrue(vehicle.isConnected());

        assert.isTrue(await gunther.issueCommand('/v ' + russell.id + ' delete'));

        assert.isNull(russell.vehicle);
        assert.isFalse(vehicle.isConnected());
    });

    it('should not be able to delete vehicles for players not in a vehicle', async(assert) => {
        const russell = server.playerManager.getById(1 /* Russell */);

        // Only administrators can delete vehicles from the server.
        gunther.level = Player.LEVEL_ADMINISTRATOR;

        const vehicle = server.vehicleManager.createVehicle({
            modelId: 411 /* Infernus */,
            position: gunther.position,
            rotation: gunther.rotation
        });

        russell.enterVehicle(vehicle, Vehicle.SEAT_DRIVER);

        assert.isNotNull(russell.vehicle);

        assert.isTrue(await gunther.issueCommand('/v ' + russell.name + ' delete'));
        assert.equal(gunther.messages.length, 1);
        assert.equal(
            gunther.messages[0], Message.format(Message.VEHICLE_NOT_DRIVING, russell.name));

        assert.isNotNull(russell.vehicle);
    });

    it('should not be able to delete unmanaged vehicles', async(assert) => {
        // Only administrators can delete vehicles from the server.
        gunther.level = Player.LEVEL_ADMINISTRATOR;

        const vehicle = server.vehicleManager.createVehicle({
            modelId: 411 /* Infernus */,
            position: gunther.position,
            rotation: gunther.rotation
        });

        gunther.enterVehicle(vehicle, Vehicle.SEAT_DRIVER);

        assert.isNotNull(gunther.vehicle);

        assert.isTrue(await gunther.issueCommand('/v delete'));
        assert.equal(gunther.messages.length, 1);
        assert.equal(
            gunther.messages[0], Message.format(Message.VEHICLE_NOT_DRIVING, gunther.name));

        assert.isNotNull(gunther.vehicle);
    });

    it('should be able to delete persistent vehicles', async(assert) => {
        // Only administrators can delete vehicles from the server.
        gunther.level = Player.LEVEL_ADMINISTRATOR;

        assert.isTrue(createVehicleForPlayer(gunther));
        assert.isNotNull(gunther.vehicle);

        assert.isFalse(manager.isPersistentVehicle(gunther.vehicle));

        await manager.storeVehicle(gunther.vehicle);
        await server.clock.advance(500);  // to re-enter the new vehicle

        assert.isNotNull(gunther.vehicle);
        assert.isTrue(manager.isPersistentVehicle(gunther.vehicle));

        const oldVehicle = gunther.vehicle;

        assert.isTrue(await gunther.issueCommand('/v delete'));
        assert.isNull(gunther.vehicle);

        assert.isFalse(oldVehicle.isConnected());
    });

    it('should be able to update and tell the health of vehicles', async(assert) => {
        // Only administrators can manipulate vehicle health on the server.
        gunther.level = Player.LEVEL_ADMINISTRATOR;

        assert.isTrue(createVehicleForPlayer(gunther));
        assert.isNotNull(gunther.vehicle);

        gunther.vehicle.health = 950;

        assert.isTrue(await gunther.issueCommand('/v health'));
        assert.equal(gunther.messages.length, 2);
        assert.equal(gunther.messages[0], Message.format(Message.VEHICLE_HEALTH_CURRENT, 950));

        gunther.clearMessages();

        assert.isTrue(await gunther.issueCommand('/v health 9001'));  // must be in [0, 1000]
        assert.equal(gunther.messages.length, 2);
        assert.equal(gunther.messages[0], Message.format(Message.VEHICLE_HEALTH_CURRENT, 950));

        gunther.clearMessages();

        assert.isTrue(await gunther.issueCommand('/v health 500'));
        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.format(Message.VEHICLE_HEALTH_UPDATED, 950, 500));

        assert.equal(gunther.vehicle.health, 500);
    });

    it('should be able to respawn vehicles on the server', async(assert) => {
        // Only administrators can respawn vehicles on the server.
        gunther.level = Player.LEVEL_ADMINISTRATOR;

        gunther.position = new Vector(10, 505, 995);  // within streaming radius of the vehicle

        assert.isTrue(createVehicleForPlayer(gunther, {
            position: new Vector(0, 500, 1000)
        }));

        const vehicle = gunther.vehicle;
        assert.isNotNull(vehicle);
        assert.isTrue(vehicle.isConnected());

        vehicle.position = new Vector(1000, 2000, 3000);

        assert.isTrue(await gunther.issueCommand('/v respawn'));

        assert.isNull(gunther.vehicle);
        assert.isTrue(vehicle.isConnected());

        assert.equal(vehicle.respawnCount, 1);
        assert.deepEqual(vehicle.position, new Vector(0, 500, 1000));
    });

    it('should enable Management to optimise the vehicle streamer', async(assert) => {
        // Only Management members can pin and unpin vehicles on the server.
        gunther.level = Player.LEVEL_MANAGEMENT;

        let optimised = false;

        // Override the optimise() call in the streamer to verify that it actually got called.
        manager.streamer.optimise = () => optimised = true;

        assert.isTrue(await gunther.issueCommand('/v optimise'));
        assert.isTrue(optimised);
    });

    it('should enable Management to pin and unpin their vehicles', async(assert) => {
        // Only Management members can pin and unpin vehicles on the server.
        gunther.level = Player.LEVEL_MANAGEMENT;

        assert.isTrue(createVehicleForPlayer(gunther));
        assert.isNotNull(gunther.vehicle)

        const storedVehicle = manager.streamer.getStoredVehicle(gunther.vehicle);
        assert.isNotNull(storedVehicle);

        // The |storedVehicle| is pinned because |gunther| is driving it.
        assert.isTrue(manager.streamer.isPinned(storedVehicle));
        assert.isFalse(manager.streamer.isPinned(storedVehicle, VehicleManager.MANAGEMENT_PIN));

        assert.isTrue(await gunther.issueCommand('/v pin'));
        assert.isTrue(manager.streamer.isPinned(storedVehicle));
        assert.isTrue(manager.streamer.isPinned(storedVehicle, VehicleManager.MANAGEMENT_PIN));

        assert.isTrue(await gunther.issueCommand('/v unpin'));
        assert.isTrue(manager.streamer.isPinned(storedVehicle));
        assert.isFalse(manager.streamer.isPinned(storedVehicle, VehicleManager.MANAGEMENT_PIN));
    });

    it('should be able to save vehicles to the database', async(assert) => {
        // Only administrators can save vehicles in the database.
        gunther.level = Player.LEVEL_ADMINISTRATOR;

        assert.isTrue(createVehicleForPlayer(gunther));

        assert.isNotNull(gunther.vehicle);
        assert.isTrue(gunther.vehicle.isConnected());

        assert.isTrue(manager.isManagedVehicle(gunther.vehicle));
        assert.isFalse(manager.isPersistentVehicle(gunther.vehicle));

        const oldVehicle = gunther.vehicle;

        assert.isTrue(await gunther.issueCommand('/v save'));
        assert.equal(gunther.messages.length, 2);
        assert.equal(
            gunther.messages[1], Message.format(Message.VEHICLE_SAVED, 'Infernus'));

        await server.clock.advance(500);  // to re-enter the new vehicle

        assert.isNotNull(gunther.vehicle);
        assert.isTrue(gunther.vehicle.isConnected());

        assert.isTrue(manager.isManagedVehicle(gunther.vehicle));
        assert.isTrue(manager.isPersistentVehicle(gunther.vehicle));

        assert.notEqual(gunther.vehicle, oldVehicle);

        gunther.clearMessages();

        assert.isTrue(await gunther.issueCommand('/v save'));
        assert.equal(gunther.messages.length, 1);
        assert.equal(
            gunther.messages[0], Message.format(Message.VEHICLE_SAVE_REDUNDANT, 'Infernus'));
    });

    it('should clean up the commands when being disposed of', async(assert) => {
        const originalCommandCount = server.commandManager.size;

        commands.dispose();
        commands.dispose = () => true;

        assert.equal(server.commandManager.size, originalCommandCount - 1);
    });
});
