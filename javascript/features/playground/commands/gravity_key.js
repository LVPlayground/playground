// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Command from 'features/playground/command.js';
import { CommandBuilder } from 'components/command_manager/command_builder.js';

// Command: /gravitykey [player]
export default class GravityKeyCommand extends Command {
    get name() { return 'gravitykey'; }
    get defaultPlayerLevel() { return Player.LEVEL_MANAGEMENT; }

    build(commandBuilder) {
        commandBuilder
            .parameters([{ name: 'target', type: CommandBuilder.PLAYER_PARAMETER, optional: true }])
            .build(GravityKeyCommand.prototype.onGravityKeyCommand.bind(this));
    }

    // Turn on or off the ability to use indicators.
    async onGravityKeyCommand(player, target) {
        const subject = target || player;

        if (subject.syncedData.vehicleKeys & Vehicle.kVehicleKeysGravity) {
            subject.syncedData.vehicleKeys &= ~ Vehicle.kVehicleKeysGravity;
            subject.gravity = Player.kDefaultGravity;

            player.sendMessage(Message.COMMAND_SUCCESS, subject.name + ' can\'t switch gravity anymore.');
            return;
        }
        
        subject.syncedData.vehicleKeys |= Vehicle.kVehicleKeysGravity;
        player.sendMessage(Message.COMMAND_SUCCESS, subject.name + ' will now able to switch gravity.');
    }
}
