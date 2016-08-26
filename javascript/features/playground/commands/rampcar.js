// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Command = require('features/playground/command.js');
const CommandBuilder = require('components/command_manager/command_builder.js');
const ScopedEntities = require('entities/scoped_entities.js');

// Command: /rampcar [player]?
class RampCarCommand extends Command {
    constructor() {
        super();
        this.rampCar_ = new ScopedEntities();
    }

    get name() { return 'rampcar'; }
    get defaultPlayerLevel() { return Player.LEVEL_ADMINISTRATOR; }

    build(commandBuilder) {
        commandBuilder
            .sub(CommandBuilder.PLAYER_PARAMETER)
                .restrict(Player.LEVEL_ADMINISTRATOR)
                .build(RampCarCommand.prototype.onRampCarCommand.bind(this))
            .build(RampCarCommand.prototype.onRampCarCommand.bind(this));
    }

    onRampCarCommand(player, target) {
        const vehicleId = pawnInvoke('GetPlayerVehicleID', 'i', target.id);
        if (vehicleId != 0)
            pawnInvoke('SetVehicleToRespawn', 'i', vehicleId);

        var rampVehicleId = this.rampCar_.createVehicle({
            modelId: 411,
            position: target.position,
            rotation: target.rotation,
            primaryColor: 126,
            secondaryColor: 1,
            siren: true,
            paintjob: null,
            interiorId: target.interiorId,
            virtualWorld: target.virtualWorld
        });

        var rampObject = this.rampCar_.createObject({
            modelId: 13593,
            position: target.position,
            rotation: target.rotation,
            interiorId: target.interiorId,
            virtualWorld: target.virtualWorld
        });

        if (rampObject!= GameObject.INVALID_ID)
            rampObject.attachToVehicle(rampVehicleId, new Vector(0.0, 0.0, 0.0), new Vector(0.0, 0.0, 0.0));

        if (rampVehicleId != Vehicle.INVALID_ID)
            pawnInvoke('PutPlayerInVehicle', 'iii', target.id, rampVehicleId, 0);
    }

    dispose() {
        this.rampCar_.dispose();
    }
}

exports = RampCarCommand;
