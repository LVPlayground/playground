// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Command = require('features/playground/command.js');
const CommandBuilder = require('components/command_manager/command_builder.js');

// Command: /boost [player] [factor]
class BoostCommand extends Command {
    get name() { return 'boost'; }
    get defaultPlayerLevel() { return Player.LEVEL_MANAGEMENT; }

    build(commandBuilder) {
        commandBuilder
            .parameters([ { name: 'target', type: CommandBuilder.PLAYER_PARAMETER },
                          { name: 'factor', type: CommandBuilder.NUMBER_PARAMETER } ])
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

exports = BoostCommand;
