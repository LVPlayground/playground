// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Command } from 'features/playground/command.js';
import { CommandBuilder } from 'components/commands/command_builder.js';

// Command: /boost [player] [factor]
export default class BoostCommand extends Command {
    get name() { return 'boost'; }
    get defaultPlayerLevel() { return Player.LEVEL_ADMINISTRATOR; }
    get description() { return 'Boost the speed at which someone is driving.' }

    build(commandBuilder) {
        commandBuilder
            .parameters([ { name: 'target', type: CommandBuilder.kTypePlayer },
                          { name: 'factor', type: CommandBuilder.kTypeNumber } ])
            .build(BoostCommand.prototype.onBoostCommand.bind(this));
    }

    // Note that this implementation uses pawnInvoke() because the target vehicle may not be owned
    // by the JavaScript code, and the command should work for all vehicles.
    onBoostCommand(player, target, factor) {
        const vehicleId = pawnInvoke('GetPlayerVehicleID', 'i', target.id);
        if (vehicleId == 0 || vehicleId > 3000) {
            player.sendMessage(Message.COMMAND_ERROR, target.name + ' is not driving a vehicle.');
            return;
        }

        const velocity = pawnInvoke('GetVehicleVelocity', 'iFFF', vehicleId);
        pawnInvoke('SetVehicleVelocity', 'ifff',
            vehicleId, velocity[0] * factor, velocity[1] * factor, velocity[2] * factor);

        player.sendMessage(Message.COMMAND_SUCCESS, target.name + ' has been boosted.');
    }
}
