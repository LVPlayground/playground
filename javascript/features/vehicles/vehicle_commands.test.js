// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const AbuseConstants = require('features/abuse/abuse_constants.js');
const DatabaseVehicle = require('features/vehicles/database_vehicle.js');
const MockAbuse = require('features/abuse/test/mock_abuse.js');
const MockAnnounce = require('features/announce/test/mock_announce.js');
const MockPlayground = require('features/playground/test/mock_playground.js');
const Settings = require('features/settings/settings.js');
const Streamer = require('features/streamer/streamer.js');
const VehicleManager = require('features/vehicles/vehicle_manager.js');
const Vehicles = require('features/vehicles/vehicles.js');

describe('VehicleCommands', (it, beforeEach) => {
    let abuse = null;
    let commands = null;
    let gunther = null;
    let playground = null;
    let manager = null;

    beforeEach(async(assert) => {
        gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.identify({ userId: 42 });

        server.featureManager.registerFeaturesForTests({
            abuse: MockAbuse,
            announce: MockAnnounce,
            playground: MockPlayground,
            settings: Settings,
            streamer: Streamer,
            vehicles: Vehicles
        });

        const vehicles = server.featureManager.loadFeature('vehicles');
        
        abuse = server.featureManager.loadFeature('abuse');

        playground = server.featureManager.loadFeature('playground');
        playground.access.addException('v', gunther);

        commands = vehicles.commands_;
        commands.hasFinishedSprayTagCollection_ = player => false;

        manager = vehicles.manager_;
        manager.reportVehicleDestroyed_ = vehicleId => false;

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

    it('should be able to /lock vehicles on the server', async(assert) => {
        const russell = server.playerManager.getById(1 /* Russell */);
        assert.isFalse(russell.isRegistered());

        assert.isTrue(createVehicleForPlayer(russell));
        assert.isNotNull(russell.vehicle);

        const vehicle = russell.vehicle;

        const databaseVehicle = manager.getManagedDatabaseVehicle(vehicle);
        assert.isNotNull(databaseVehicle);

        assert.isFalse(manager.access.isLocked(databaseVehicle));
        assert.isTrue(manager.access.canAccessVehicle(russell, databaseVehicle));
        assert.isTrue(manager.access.canAccessVehicle(gunther, databaseVehicle));

        // (1) Unregistered players should not be able to use this command.
        {
            assert.isTrue(await russell.issueCommand('/lock'));
            assert.equal(russell.messages.length, 1);
            assert.equal(russell.messages[0], Message.VEHICLE_LOCK_UNREGISTERED);

            russell.clearMessages();
            russell.identify({ userId: 8951 });
        }

        // (2) Registered players shouldn't be able to lock vehicles they're not driving.
        {
            russell.leaveVehicle();
            russell.enterVehicle(vehicle, Vehicle.SEAT_PASSENGER);

            assert.isTrue(await russell.issueCommand('/lock'));
            assert.equal(russell.messages.length, 1);
            assert.equal(russell.messages[0], Message.VEHICLE_LOCK_PASSENGER);

            russell.clearMessages();
        }

        // (3) Registered players should be able to lock the vehicle they're driving.
        {
            russell.leaveVehicle();
            russell.enterVehicle(vehicle, Vehicle.SEAT_DRIVER);

            assert.isTrue(await russell.issueCommand('/lock'));
            assert.equal(russell.messages.length, 1);
            assert.equal(russell.messages[0],
                         Message.format(Message.VEHICLE_LOCKED, russell.vehicle.model.name));

            assert.isTrue(manager.access.isLocked(databaseVehicle));
            assert.isTrue(manager.access.canAccessVehicle(russell, databaseVehicle));
            assert.isFalse(manager.access.canAccessVehicle(gunther, databaseVehicle));

            russell.clearMessages();
        }

        // (4) It should realize that it's already locked.
        {
            assert.isTrue(await russell.issueCommand('/lock'));
            assert.equal(russell.messages.length, 1);
            assert.equal(russell.messages[0],
                         Message.format(Message.VEHICLE_LOCK_REDUNDANT, russell.vehicle.model.name))
        }
    });

    it('should be able to /unlock vehicles on the server', async(assert) => {
        const russell = server.playerManager.getById(1 /* Russell */);
        assert.isFalse(russell.isRegistered());

        assert.isTrue(createVehicleForPlayer(russell));
        assert.isNotNull(russell.vehicle);

        const vehicle = russell.vehicle;

        const databaseVehicle = manager.getManagedDatabaseVehicle(vehicle);
        assert.isNotNull(databaseVehicle);

        // (1) Unregistered players should not be able to use this command.
        {
            assert.isTrue(await russell.issueCommand('/unlock'));
            assert.equal(russell.messages.length, 1);
            assert.equal(russell.messages[0], Message.VEHICLE_UNLOCK_UNREGISTERED);

            russell.clearMessages();
            russell.identify({ userId: 8951 });
        }

        manager.access.restrictToPlayer(databaseVehicle, russell.userId);

        assert.isTrue(manager.access.isLocked(databaseVehicle));
        assert.isTrue(manager.access.canAccessVehicle(russell, databaseVehicle));
        assert.isFalse(manager.access.canAccessVehicle(gunther, databaseVehicle));

        // (2) Registered players shouldn't be able to lock vehicles they're not driving.
        {
            russell.leaveVehicle();
            russell.enterVehicle(vehicle, Vehicle.SEAT_PASSENGER);

            assert.isTrue(await russell.issueCommand('/unlock'));
            assert.equal(russell.messages.length, 1);
            assert.equal(russell.messages[0], Message.VEHICLE_UNLOCK_PASSENGER);

            russell.clearMessages();
        }

        // (3) Registered players should be able to unlock the vehicle they're driving.
        {
            russell.leaveVehicle();
            russell.enterVehicle(vehicle, Vehicle.SEAT_DRIVER);

            assert.isTrue(await russell.issueCommand('/unlock'));
            assert.equal(russell.messages.length, 1);
            assert.equal(russell.messages[0],
                         Message.format(Message.VEHICLE_UNLOCKED, russell.vehicle.model.name));

            assert.isFalse(manager.access.isLocked(databaseVehicle));
            assert.isTrue(manager.access.canAccessVehicle(russell, databaseVehicle));
            assert.isTrue(manager.access.canAccessVehicle(gunther, databaseVehicle));

            russell.clearMessages();
        }

        // (4) It should realize that it's already unlocked.
        {
            assert.isTrue(await russell.issueCommand('/unlock'));
            assert.equal(russell.messages.length, 1);
            assert.equal(
                russell.messages[0],
                Message.format(Message.VEHICLE_UNLOCK_REDUNDANT, russell.vehicle.model.name));
        }
    });

    it('should enable the quick vehicle commands based on their requirements', async(assert) => {
        let finishedSprayTagCollection = false;

        const toggleCommand = enabled => {
            if (enabled)
                playground.access.addException('v', gunther);
            else
                playground.access.removeException('v', gunther);
        };

        const toggleSprayTags = enabled =>
            finishedSprayTagCollection = enabled;

        // Now make sure that we're in control of the spray tag access check.
        commands.hasFinishedSprayTagCollection_ = player => finishedSprayTagCollection;

        // (1) Players who can neither use `/v`, nor have all spray tags, can use these commands.
        {
            toggleCommand(false);
            toggleSprayTags(false);

            assert.isTrue(await gunther.issueCommand('/inf'));
            assert.equal(gunther.messages.length, 1);
            assert.equal(gunther.messages[0], Message.VEHICLE_QUICK_SPRAY_TAGS);
            assert.isNull(gunther.vehicle);

            gunther.clearMessages();
        }

        // (2) Players who are allowed to use `/v` can use the commands.
        {
            toggleCommand(true);
            toggleSprayTags(false);

            assert.isTrue(await gunther.issueCommand('/inf'));
            assert.equal(gunther.messages.length, 1);
            assert.equal(
                gunther.messages[0], Message.format(Message.VEHICLE_SPAWN_CREATED, 'Infernus'));
            assert.isNotNull(gunther.vehicle);

            gunther.clearMessages();
            gunther.leaveVehicle();
        }

        // (3) Players are only allowed to spawn such vehicles once per three minutes.
        {
            assert.isTrue(await gunther.issueCommand('/nrg'));
            assert.equal(gunther.messages.length, 1);
            assert.equal(
                gunther.messages[0], Message.format(Message.VEHICLE_SPAWN_REJECTED,
                                                    'can only do so once per 3 minutes'));
            assert.isNull(gunther.vehicle);

            gunther.clearMessages();
        }

        await server.clock.advance(180 * 1000);

        // (4) Players who have collected all spray tags can use the commands.
        {
            toggleCommand(false);
            toggleSprayTags(true);

            assert.isTrue(await gunther.issueCommand('/nrg'));
            assert.equal(gunther.messages.length, 1);
            assert.equal(
                gunther.messages[0], Message.format(Message.VEHICLE_SPAWN_CREATED, 'NRG-500'));
            assert.isNotNull(gunther.vehicle);

            gunther.clearMessages();
            gunther.leaveVehicle();
        }

        // (5) Players may not be in a vehicle when using this command.
        {
            assert.isTrue(createVehicleForPlayer(gunther));
            assert.isNotNull(gunther.vehicle);

            const originalVehicle = gunther.vehicle;

            assert.isTrue(await gunther.issueCommand('/inf'));
            assert.equal(gunther.messages.length, 1);
            assert.equal(gunther.messages[0], Message.VEHICLE_QUICK_ALREADY_DRIVING);
            assert.equal(gunther.vehicle, originalVehicle);

            gunther.clearMessages();
            gunther.leaveVehicle();
        }

        // (6) Players must be outside in the main world in order to use the command.
        {
            gunther.interiorId = 7;

            assert.isTrue(await gunther.issueCommand('/inf'));
            assert.equal(gunther.messages.length, 1);
            assert.equal(gunther.messages[0], Message.VEHICLE_QUICK_MAIN_WORLD);
            assert.isNull(gunther.vehicle);

            gunther.clearMessages();
            gunther.interiorId = 0;
        }

        await server.clock.advance(180 * 1000);

        // (7) Players must not have been refused from spawning vehicles.
        {
            gunther.shoot();

            assert.isTrue(await gunther.issueCommand('/inf'));
            assert.equal(gunther.messages.length, 1);
            assert.equal(gunther.messages[0], Message.format(Message.VEHICLE_SPAWN_REJECTED,
                                                             AbuseConstants.REASON_FIRED_WEAPON));
            assert.isNull(gunther.vehicle);

            gunther.clearMessages();
        }
    });

    it('should enable players to use the quick vehicle commands', async(assert) => {
        assert.equal(manager.getVehicleLimitForPlayer(gunther), 1);

        const commands = ['ele', 'inf', 'nrg', 'sul', 'tur', 'vor'];
        let previousVehicle = null;

        for (const command of commands) {
            assert.isTrue(await gunther.issueCommand('/' + command));
            assert.equal(gunther.messages.length, 1);

            if (previousVehicle)
                assert.isFalse(previousVehicle.isConnected());

            assert.isNotNull(gunther.vehicle);
            assert.isTrue(gunther.vehicle.model.name.toLowerCase().includes(command));

            previousVehicle = gunther.vehicle;

            // Teleport |gunther| out of their vehicle.
            gunther.position = gunther.vehicle.position;

            gunther.clearMessages();

            // Forward the clock so that the player is allowed to use spawn vehicles again.
            await server.clock.advance(180 * 1000);
        }
    });

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

        const commandPromise = gunther.issueCommand('/v YDRa');  // odd spelling for "Hydra"

        await Promise.resolve();  // to trigger the command
        await server.clock.advance(350);  // to enter the vehicle
        await commandPromise;

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.format(Message.VEHICLE_SPAWN_CREATED, 'Hydra'));

        assert.isNotNull(gunther.vehicle);
        assert.equal(gunther.vehicle.modelId, 520 /* Hydra */);
    });

    it('should be able to display the current access restrictions of a vehicle', async(assert) => {
        // Only administrators can display the restrictions of a vehicle.
        gunther.level = Player.LEVEL_ADMINISTRATOR;

        assert.isTrue(createVehicleForPlayer(gunther));
        assert.isNotNull(gunther.vehicle);

        const vehicle = gunther.vehicle;

        // No restrictions.
        {
            await manager.updateVehicleAccess(vehicle, DatabaseVehicle.ACCESS_TYPE_EVERYONE, 0);

            assert.isTrue(await gunther.issueCommand('/v access'));
            assert.equal(gunther.messages.length, 2);
            assert.equal(
                gunther.messages[0],
                Message.format(Message.VEHICLE_ACCESS_UNRESTRICTED, vehicle.model.name));

            gunther.clearMessages();
        }

        // Restricted to VIPs.
        {
            await manager.updateVehicleAccess(vehicle, DatabaseVehicle.ACCESS_TYPE_PLAYER_VIP, 0);

            assert.isTrue(await gunther.issueCommand('/v access'));
            assert.equal(gunther.messages.length, 2);
            assert.equal(
                gunther.messages[0],
                Message.format(Message.VEHICLE_ACCESS_RESTRICTED, vehicle.model.name,
                               'VIP members'));

            gunther.clearMessages();
        }

        // Restricted to administrators.
        {
            await manager.updateVehicleAccess(
                vehicle, DatabaseVehicle.ACCESS_TYPE_PLAYER_LEVEL, Player.LEVEL_ADMINISTRATOR);

            assert.isTrue(await gunther.issueCommand('/v access'));
            assert.equal(gunther.messages.length, 2);
            assert.equal(
                gunther.messages[0],
                Message.format(Message.VEHICLE_ACCESS_RESTRICTED, vehicle.model.name,
                               'administrators'));

            gunther.clearMessages();
        }

        // Restricted to a particular player.
        {
            await manager.updateVehicleAccess(vehicle, DatabaseVehicle.ACCESS_TYPE_PLAYER, 123456);

            assert.isTrue(await gunther.issueCommand('/v access'));
            assert.equal(gunther.messages.length, 2);
            assert.equal(
                gunther.messages[0],
                Message.format(Message.VEHICLE_ACCESS_RESTRICTED, vehicle.model.name,
                               'a particular player'));

            gunther.clearMessages();
        }
    });

    it('should be able to restrict access to a vehicle', async(assert) => {
        // Only administrators can change the restrictions of a vehicle.
        gunther.level = Player.LEVEL_ADMINISTRATOR;

        assert.isTrue(createVehicleForPlayer(gunther));
        assert.isNotNull(gunther.vehicle);

        const databaseVehicle = manager.getManagedDatabaseVehicle(gunther.vehicle);
        const vehicle = gunther.vehicle;

        assert.equal(databaseVehicle.accessType, DatabaseVehicle.ACCESS_TYPE_EVERYONE);

        // Restrict to VIP members
        {
            assert.isTrue(await gunther.issueCommand('/v access VIPs'));
            assert.equal(databaseVehicle.accessType, DatabaseVehicle.ACCESS_TYPE_PLAYER_VIP);
            assert.equal(databaseVehicle.accessValue, 0);
        }

        // Restrict to administrators
        {
            assert.isTrue(await gunther.issueCommand('/v access administrators'));
            assert.equal(databaseVehicle.accessType, DatabaseVehicle.ACCESS_TYPE_PLAYER_LEVEL);
            assert.equal(databaseVehicle.accessValue, Player.LEVEL_ADMINISTRATOR);
        }

        // Only Management can restrict vehicles to Management.
        gunther.level = Player.LEVEL_MANAGEMENT;

        // Restrict to Management
        {
            assert.isTrue(await gunther.issueCommand('/v access manAGEment'));
            assert.equal(databaseVehicle.accessType, DatabaseVehicle.ACCESS_TYPE_PLAYER_LEVEL);
            assert.equal(databaseVehicle.accessValue, Player.LEVEL_MANAGEMENT);
        }
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

    it('should warn when trying to delete the vehicle of a non-existing player', async(assert) => {
        // Only administrators can delete vehicles from the server.
        gunther.level = Player.LEVEL_ADMINISTRATOR;

        assert.isTrue(createVehicleForPlayer(gunther));

        const vehicle = gunther.vehicle;
        assert.isNotNull(vehicle);
        assert.isTrue(vehicle.isConnected());

        // Try to delete the vehicle through another player's Id.
        {
            assert.isNull(server.playerManager.getById(123));
            assert.isTrue(await gunther.issueCommand('/v 123 delete'));
            assert.equal(gunther.messages.length, 1);
            assert.equal(gunther.messages[0],
                         Message.format(Message.COMMAND_ERROR_UNKNOWN_PLAYER, '123'));

            assert.isNotNull(gunther.vehicle);
            assert.isTrue(vehicle.isConnected());

            gunther.clearMessages();
        }

        // Try to delete the vehicle through another player's name.
        {
            assert.isNull(server.playerManager.getByName('Darkfire'));
            assert.isTrue(await gunther.issueCommand('/v Darkfire delete'));
            assert.equal(gunther.messages.length, 1);
            assert.equal(gunther.messages[0],
                         Message.format(Message.COMMAND_ERROR_UNKNOWN_PLAYER, 'Darkfire'));

            assert.isNotNull(gunther.vehicle);
            assert.isTrue(vehicle.isConnected());
        }
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

    it('should be able to tell the density of vehicles around the administrator', async(assert) => {
        // Only administrators can compute the density level around them.
        gunther.level = Player.LEVEL_ADMINISTRATOR;

        // Create three vehicles of two different models around the player's position.
        for (const modelId of [520, 520, 411]) {
            await manager.createVehicle({
                modelId: modelId,
                position: gunther.position,
                rotation: 90,
                interiorId: gunther.interiorId,
                virtualWorld: gunther.virtualWorld
            });
        }

        assert.isTrue(await gunther.issueCommand('/v density'));
        assert.equal(gunther.messages.length, 2);
        assert.equal(gunther.messages[0], Message.format(Message.VEHICLE_DENSITY, 3, 2,
                                                         manager.streamer.streamingDistance));
        assert.equal(gunther.messages[1], Message.format(Message.VEHICLE_DENSITY_TOTAL,
                                                         manager.streamer.size,
                                                         manager.streamer.streamedSize));
    });

    it('should enable administrators to enter vehicles close to them', async(assert) => {
        const russell = server.playerManager.getById(1 /* Russell */);

        // Only administrators can forcefully enter vehicles.
        gunther.level = Player.LEVEL_ADMINISTRATOR;

        // (1) It should bail out when there are no vehicles nearby.
        {
            assert.isTrue(await gunther.issueCommand('/v enter'));
            assert.equal(gunther.messages.length, 1);
            assert.equal(gunther.messages[0], Message.VEHICLE_ENTER_NONE_NEAR);

            gunther.clearMessages();
        }

        // Create a vehicle that's reasonable close to Gunther his position.
        const vehicle = await manager.createVehicle({
            modelId: 411 /* Infernus */,
            position: gunther.position.translate({ x: 3, y: -5 }),
            rotation: 90,
            interiorId: gunther.interiorId,
            virtualWorld: gunther.virtualWorld
        });

        assert.isNotNull(vehicle);

        // (2) It should bail out when the vehicle is restricted to a player.
        {
            const databaseVehicle = manager.getManagedDatabaseVehicle(vehicle);
            assert.isNotNull(databaseVehicle);

            databaseVehicle.accessType = DatabaseVehicle.ACCESS_TYPE_PLAYER;

            assert.isTrue(await gunther.issueCommand('/v enter'));
            assert.equal(gunther.messages.length, 1);
            assert.equal(gunther.messages[0], Message.VEHICLE_ENTER_RESTRICTED);

            databaseVehicle.accessType = DatabaseVehicle.ACCESS_TYPE_EVERYONE;

            gunther.clearMessages();
        }

        // (3) It should bail out when being given an invalid seat.
        {
            assert.isTrue(await gunther.issueCommand('/v enter 9001'));
            assert.equal(gunther.messages.length, 1);
            assert.equal(gunther.messages[0], Message.VEHICLE_ENTER_SEAT_INVALID);

            gunther.clearMessages();
        }

        // Make Russell enter the vehicle in the passenger seat.
        russell.enterVehicle(vehicle, Vehicle.SEAT_PASSENGER);

        // (4) It should bail out when trying to enter in a seat that's already occupied.
        {
            assert.isTrue(await gunther.issueCommand('/v enter 1'));
            assert.equal(gunther.messages.length, 1);
            assert.equal(
                gunther.messages[0],
                Message.format(Message.VEHICLE_ENTER_SEAT_OCCUPIED, russell.vehicle.model.name));

            gunther.clearMessages();
        }

        // (5) It should enter the vehicle when the seat is available.
        {
            assert.isTrue(await gunther.issueCommand('/v enter'));
            assert.equal(gunther.messages.length, 1);
            assert.equal(gunther.messages[0],
                         Message.format(Message.VEHICLE_ENTERED, russell.vehicle.model.name));

            gunther.clearMessages();
        }

        // (6) It should bail out when Gunther already is in another vehicle.
        {
            assert.isTrue(await gunther.issueCommand('/v enter'));
            assert.equal(gunther.messages.length, 1);
            assert.equal(
                gunther.messages[0],
                Message.format(Message.VEHICLE_ENTER_ALREADY_DRIVING, russell.vehicle.model.name));
        }
    });

    it('should have comprehensive output when requesting help', async(assert) => {
        gunther.level = Player.LEVEL_PLAYER;
        {
            assert.isTrue(await gunther.issueCommand('/v help'));
            assert.equal(gunther.messages.length, 1);
            assert.equal(gunther.messages[0], Message.VEHICLE_HELP_SPAWN);

            gunther.clearMessages();
        }
        
        gunther.level = Player.LEVEL_ADMINISTRATOR;
        {
            assert.isTrue(await gunther.issueCommand('/v help'));
            assert.equal(gunther.messages.length, 3);
            assert.equal(gunther.messages[0], Message.VEHICLE_HELP_SPAWN);
            assert.isFalse(gunther.messages[1].includes('optimise'));
            assert.isFalse(gunther.messages[2].includes('unpin'));

            gunther.clearMessages();
        }

        gunther.level = Player.LEVEL_MANAGEMENT;
        {
            assert.isTrue(await gunther.issueCommand('/v help'));
            assert.equal(gunther.messages.length, 3);
            assert.equal(gunther.messages[0], Message.VEHICLE_HELP_SPAWN);
            assert.isTrue(gunther.messages[1].includes('optimise'));
            assert.isTrue(gunther.messages[2].includes('unpin'));
        }
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

    it('should be able to reset the vehicle layout on the server', async(assert) => {
        // Only administrators can reset vehicles on the server.
        gunther.level = Player.LEVEL_ADMINISTRATOR;

        assert.isTrue(createVehicleForPlayer(gunther));
        assert.isNotNull(gunther.vehicle);

        const vehicle = manager.createVehicle({
            modelId: 411 /* Infernus */,
            position: gunther.position,
            rotation: 90,
            interiorId: gunther.interiorId,
            virtualWorld: gunther.virtualWorld
        });

        assert.isNotNull(vehicle);
        assert.isTrue(vehicle.isConnected());

        assert.deepEqual(gunther.vehicle.position, gunther.position);
        assert.deepEqual(vehicle.position, gunther.position);

        gunther.vehicle.position = new Vector(200, 300, 400);
        vehicle.position = new Vector(100, 500, 900);

        assert.notDeepEqual(gunther.vehicle.position, gunther.position);
        assert.notDeepEqual(vehicle.position, gunther.position);

        assert.isTrue(await gunther.issueCommand('/v reset'));

        // Gunther's vehicle is occupied so should be left alone. The |vehicle| should respawn.
        assert.notDeepEqual(gunther.vehicle.position, gunther.position);
        assert.deepEqual(vehicle.position, gunther.position);

        assert.equal(gunther.vehicle.respawnCount, 0);
        assert.equal(vehicle.respawnCount, 1);
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

        assert.isTrue(await gunther.issueCommand('/v save'));
        assert.isFalse(vehicle.isConnected());

        await server.clock.advance(500);  // to re-enter the new vehicle

        const newVehicle = gunther.vehicle;
        assert.isNotNull(newVehicle);

        newVehicle.position = new Vector(1000, 2000, 3000);

        assert.isTrue(manager.isPersistentVehicle(newVehicle));
        assert.isTrue(await gunther.issueCommand('/v respawn'));

        assert.isNull(gunther.vehicle);
        assert.isTrue(newVehicle.isConnected());

        assert.equal(newVehicle.respawnCount, 1);
        assert.deepEqual(newVehicle.position, new Vector(0, 500, 1000));
    });

    it('should destroy ephemeral vehicles when respawning them', async(assert) => {
        // Only administrators can respawn vehicles on the server.
        gunther.level = Player.LEVEL_ADMINISTRATOR;

        gunther.position = new Vector(10, 505, 995);  // within streaming radius of the vehicle

        assert.isTrue(createVehicleForPlayer(gunther, {
            position: new Vector(0, 500, 1000)
        }));

        const vehicle = gunther.vehicle;
        assert.isNotNull(vehicle);

        assert.isFalse(manager.isPersistentVehicle(vehicle));
        assert.isTrue(await gunther.issueCommand('/v respawn'));

        assert.isNull(gunther.vehicle);
        assert.isFalse(vehicle.isConnected());
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

    it('should not save vehicles when the area is too busy', async(assert) => {
        // Only administrators can save vehicles in the database.
        gunther.level = Player.LEVEL_ADMINISTRATOR;

        assert.isTrue(createVehicleForPlayer(gunther));

        assert.isNotNull(gunther.vehicle);
        assert.isTrue(gunther.vehicle.isConnected());

        // Create a hundred other vehicles in the area.
        for (let i = 0; i < 100; ++i) {
            manager.createVehicle({
                modelId: (i % 2 == 0 ? 411 /* Infernus */ : 520 /* Hydra */),
                position: gunther.vehicle.position,
                rotation: 90,
                interiorId: gunther.interiorId,
                virtualWorld: gunther.virtualWorld
            });
        }

        // Make sure that trying to save Gunther's current vehicle fails.
        assert.isTrue(await gunther.issueCommand('/v save'));
        assert.equal(gunther.messages.length, 1);
        assert.equal(
            gunther.messages[0], Message.format(Message.VEHICLE_SAVE_TOO_BUSY, 101, 90, 2, 50));
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
            gunther.messages[1], Message.format(Message.VEHICLE_SAVED, 'Infernus', 'saved'));

        await server.clock.advance(500);  // to re-enter the new vehicle

        assert.isNotNull(gunther.vehicle);
        assert.isTrue(gunther.vehicle.isConnected());

        assert.isTrue(manager.isManagedVehicle(gunther.vehicle));
        assert.isTrue(manager.isPersistentVehicle(gunther.vehicle));

        assert.notStrictEqual(gunther.vehicle, oldVehicle);

        assert.equal(gunther.vehicle.primaryColor, oldVehicle.primaryColor);
        assert.equal(gunther.vehicle.secondaryColor, oldVehicle.secondaryColor);
    });

    it('should clean up the commands when being disposed of', async(assert) => {
        const originalCommandCount = server.commandManager.size;

        commands.dispose();
        commands.dispose = () => true;

        assert.equal(server.commandManager.size, originalCommandCount - 9);
    });
});
