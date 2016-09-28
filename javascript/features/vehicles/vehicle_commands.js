// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const CommandBuilder = require('components/command_manager/command_builder.js');

// Responsible for providing the commands associated with vehicles. Both players and administrators
// can create vehicles. Administrators can save, modify and delete vehicles as well.
class VehicleCommands {
    constructor(manager, playground) {
        this.manager_ = manager;

        this.playground_ = playground;
        this.playground_.addReloadObserver(
            this, VehicleCommands.prototype.registerTrackedCommands);

        this.registerTrackedCommands(playground());

        // Command: /v [vehicle]? || /v [player]? [respawn]
        server.commandManager.buildCommand('v')
            .restrict(player => this.playground_().canAccessCommand(player, 'v'))
            .sub(CommandBuilder.PLAYER_PARAMETER, player => player)
                .restrict(Player.LEVEL_ADMINISTRATOR)
                .sub('delete')
                    .build(VehicleCommands.prototype.onVehicleDeleteCommand.bind(this))
                .sub('respawn')
                    .build(VehicleCommands.prototype.onVehicleRespawnCommand.bind(this))
                .sub('save')
                    .build(VehicleCommands.prototype.onVehicleSaveCommand.bind(this))
                .build(/* deliberate fall-through */)
            .sub(CommandBuilder.WORD_PARAMETER)
                .build(VehicleCommands.prototype.onVehicleCommand.bind(this))
            .build(VehicleCommands.prototype.onVehicleCommand.bind(this));
    }

    // ---------------------------------------------------------------------------------------------

    // Called when a player executes `/v` or `/v [vehicle]`, which can be either a vehicle Id or
    // part of a vehicle's name. The vehicle will be created for them.
    async onVehicleCommand(player, modelIdentifier) {
        if (!modelIdentifier) {
            player.sendMessage(Message.COMMAND_UNSUPPORTED);
            return;
        }

        let vehicleModel = null;

        // TODO: Allow fuzzy searches for the |modelIdentifier| as a vehicle model name.
        const potentialModelId = modelIdentifier.toSafeInteger();
        if (potentialModelId && potentialModelId >= 400 && potentialModelId <= 611)
            vehicleModel = VehicleModel.getById(potentialModelId);
        else
            vehicleModel = VehicleModel.getByName(modelIdentifier);
        
        if (!vehicleModel) {
            player.sendMessage(Message.VEHICLE_SPAWN_NOT_FOUND, modelIdentifier);
            return;
        }

        // TODO: Destroy earlier vehicles if this player already has one attributed to them.
        // TODO: Make sure that the vehicle destroys itself on respawn.

        const vehicle = this.manager_.createVehicle({
            modelId: vehicleModel.id,
            position: player.position,
            rotation: player.rotation,
            interiorId: player.interiorId,
            virtualWorld: player.virtualWorld
        });

        // Inform the player of their new vehicle having been created.
        player.sendMessage(Message.VEHICLE_SPAWN_CREATED, vehicleModel.name);

        // If the |vehicle| is live, teleport the |player| to the driver seat after a minor delay.
        if (!vehicle)
            return;

        await milliseconds(350);

        if (vehicle.isConnected())
            player.enterVehicle(vehicle, Vehicle.SEAT_DRIVER);
    }

    // Called when the |player| executes `/v delete` or `/v [player] delete`, which means they wish
    // to delete the vehicle the target is currently driving.
    async onVehicleDeleteCommand(player, subject) {
        const vehicle = subject.vehicle;

        // Bail out if the |subject| is not driving a vehicle, or it's not managed by this system.
        if (!this.manager_.isManagedVehicle(vehicle)) {
            player.sendMessage(Message.VEHICLE_NOT_DRIVING, subject.name);
            return;
        }

        await this.manager_.deleteVehicle(vehicle);

        // TODO: Make an announcement if the |vehicle| was a persistent one.

        player.sendMessage(Message.VEHICLE_DELETED, vehicle.model.name);
    }

    // Called when the |player| executes `/v respawn` or `/v [player] respawn`, which means they
    // wish to reset the vehicle's position to its original spot.
    onVehicleRespawnCommand(player, subject) {
        const vehicle = subject.vehicle;

        // Bail out if the |subject| is not driving a vehicle, or it's not managed by this system.
        if (!this.manager_.isManagedVehicle(vehicle)) {
            player.sendMessage(Message.VEHICLE_NOT_DRIVING, subject.name);
            return;
        }

        vehicle.respawn();

        player.sendMessage(Message.VEHICLE_RESPAWNED, vehicle.model.name);
    }

    // Called when the |player| executes `/v save` or `/v [player] save`, which means they wish to
    // save the vehicle in the database to make it a persistent vehicle.
    async onVehicleSaveCommand(player, subject) {
        const vehicle = subject.vehicle;

        // Bail out if the |subject| is not driving a vehicle, or it's not managed by this system.
        if (!this.manager_.isManagedVehicle(vehicle)) {
            player.sendMessage(Message.VEHICLE_NOT_DRIVING, subject.name);
            return;
        }

        // Bail out if the |vehicle| has already been saved in the database.
        if (this.manager_.isPersistentVehicle(vehicle)) {
            player.sendMessage(Message.VEHICLE_SAVE_REDUNDANT, vehicle.model.name);
            return;
        }

        await this.manager_.storeVehicle(vehicle);

        // TODO: Make an announcement to other administrators.

        player.sendMessage(Message.VEHICLE_SAVED, vehicle.model.name);
    }

    // ---------------------------------------------------------------------------------------------

    // Registers the privileged commands with the `/lvp access` feature.
    registerTrackedCommands(playground) {
        playground.registerCommand('v', Player.LEVEL_ADMINISTRATOR);
    }

    // Drops registrations for the privileged commands.
    unregisterTrackedCommands(playground) {
        playground.unregisterCommand('v');
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.unregisterTrackedCommands(this.playground_());

        server.commandManager.removeCommand('v');
    }
}

exports = VehicleCommands;
