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
                .sub('respawn')
                    .build(VehicleCommands.prototype.onVehicleRespawnCommand.bind(this))
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

    // Called when the player executes `/v respawn` or `/v [player] respawn`, which means they wish
    // to respawn the intended vehicle back to its original spawning position.
    onVehicleRespawnCommand(player, subject) {
        console.log('Respawning the vehicle of ' + subject.name);
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
