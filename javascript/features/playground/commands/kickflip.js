// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Command from 'features/playground/command.js';
import CommandBuilder from 'components/command_manager/command_builder.js';

// Command: /kickflip [player]
class KickFlipCommand extends Command {
    get name() { return 'kickflip'; }
    get defaultPlayerLevel() { return Player.LEVEL_MANAGEMENT; }

    build(commandBuilder) {
        commandBuilder
            .parameters([{ name: 'target', type: CommandBuilder.PLAYER_PARAMETER }])
            .build(KickFlipCommand.prototype.onKickFlipCommand.bind(this));
    }

    // Note that this implementation uses pawnInvoke() because the target vehicle may not be owned
    // by the JavaScript code, and the command should work for all vehicles.
    onKickFlipCommand(player, target) {
        const vehicleId = pawnInvoke('GetPlayerVehicleID', 'i', target.id);
        if (vehicleId == 0 || vehicleId > 3000) {
            player.sendMessage(Message.COMMAND_ERROR, target.name + ' is not driving a vehicle.');
            return;
        }

        pawnInvoke('SetVehicleAngularVelocity', 'ifff', vehicleId, 0.18, 0, 0);

        player.sendMessage(Message.COMMAND_SUCCESS, target.name + ' has been kickflip\'d.');
    }
}

export default KickFlipCommand;
