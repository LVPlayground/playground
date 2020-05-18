// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Command from 'features/playground/command.js';
import CommandBuilder from 'components/command_manager/command_builder.js';

// Command: /engine [player]
export default class EngineCommand extends Command {
    get name() { return 'engine'; }
    get defaultPlayerLevel() { return Player.LEVEL_MANAGEMENT; }

    build(commandBuilder) {
        commandBuilder
            .parameters([{ name: 'target', type: CommandBuilder.PLAYER_PARAMETER }])
            .build(EngineCommand.prototype.onEngineCommand.bind(this));
    }

    // Turn on or off the engine for the target.
    onEngineCommand(player, target) {
        const vehicleId = pawnInvoke('GetPlayerVehicleID', 'i', target.id);
        if (vehicleId == 0 || vehicleId > 3000) {
            player.sendMessage(Message.COMMAND_ERROR, target.name + ' is not driving a vehicle.');
            return;
        }

        const vehicleParams = pawnInvoke('GetVehicleParamsEx', 'iIIIIIII', vehicleId);    
        
        if(vehicleParams[0] === 1) {
            player.sendMessage(Message.COMMAND_SUCCESS, target.name + 
                '\'s engine has been turned off.');
            vehicleParams[0] = 0;
        } else {
            player.sendMessage(Message.COMMAND_SUCCESS, target.name + 
                '\'s engine has been turned on.');
                vehicleParams[0] = 1;         
        }

        pawnInvoke('SetVehicleParamsEx', 'iiiiiiii', vehicleId, vehicleParams[0], vehicleParams[1], 
            vehicleParams[2], vehicleParams[3], vehicleParams[4], vehicleParams[5], 
            vehicleParams[6]);
    }

}
