// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Command } from 'features/playground/command.js';
import { CommandBuilder } from 'components/command_manager/command_builder.js';
import { ScopedEntities } from 'entities/scoped_entities.js';

// Command: /rampcar [player]?
export default class RampCarCommand extends Command {
    constructor() {
        super();

        this.rampCar_ = new ScopedEntities();
        this.attachedRamps_ = new Map();

        server.vehicleManager.addObserver(this);
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
        const subject = target || player;

        const vehicleId = pawnInvoke('GetPlayerVehicleID', 'i', subject.id);
        if (vehicleId != 0)
            pawnInvoke('SetVehicleToRespawn', 'i', vehicleId);

        var rampVehicle = this.rampCar_.createVehicle({
            modelId: 411,
            position: subject.position,
            rotation: subject.rotation,
            primaryColor: 126,
            secondaryColor: 1,
            siren: true,
            paintjob: null,
            interiorId: subject.interiorId,
            virtualWorld: subject.virtualWorld
        });

        pawnInvoke('SetVehicleNumberPlate', 'is', rampVehicle.id, 'Ramp it up!');
        rampVehicle.addComponent(Vehicle.kComponentNitroTenShots);

        var rampObject = this.rampCar_.createObject({
            modelId: 13645,
            position: subject.position,
            rotation: new Vector(0.0, 0.0, 0.0),
            interiorId: subject.interiorId,
            virtualWorld: subject.virtualWorld
        });

        rampObject.attachToVehicle(rampVehicle, new Vector(0.0, 3.0, 0.0), new Vector(0.0, 0.0, 180.0));
        this.attachedRamps_.set(rampVehicle, rampObject);

        pawnInvoke('PutPlayerInVehicle', 'iii', subject.id, rampVehicle.id, 0);
    }

    onVehicleSpawn(vehicle) {
        if (!this.rampCar_.hasVehicle(vehicle))
            return;

        vehicle.dispose();

        this.attachedRamps_.get(vehicle).dispose();
        this.attachedRamps_.delete(vehicle);
    }

    dispose() {
        this.rampCar_.dispose();
        server.vehicleManager.removeObserver(this);
    }
}
