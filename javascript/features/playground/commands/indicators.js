// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Command } from 'features/playground/command.js';
import { CommandBuilder } from 'components/commands/command_builder.js';

// Command: /indicators [player]
export default class IndicatorsCommand extends Command {
    get name() { return 'indicators'; }
    get defaultPlayerLevel() { return Player.LEVEL_MANAGEMENT; }
    get description() { return `Toggle controls over your vehicle's indicators.`; }

    build(commandBuilder) {
        commandBuilder
            .parameters([{ name: 'target', type: CommandBuilder.kTypePlayer, optional: true }])
            .build(IndicatorsCommand.prototype.onIndicatorCommand.bind(this));
    }

    // Turn on or off the ability to use indicators.
    async onIndicatorCommand(player, target) {
        const subject = target || player;

        if (subject.syncedData.vehicleKeys & Vehicle.kVehicleKeysBlinkerRight) {
            subject.syncedData.vehicleKeys &= ~ Vehicle.kVehicleKeysBlinkerRight;
            subject.syncedData.vehicleKeys &= ~ Vehicle.kVehicleKeysBlinkerLeft;
            
            player.sendMessage(Message.COMMAND_SUCCESS, subject.name + ' can\'t use the blinkers anymore.');
            return;
        }
        
        subject.syncedData.vehicleKeys |= Vehicle.kVehicleKeysBlinkerRight;
        subject.syncedData.vehicleKeys |= Vehicle.kVehicleKeysBlinkerLeft;
        player.sendMessage(Message.COMMAND_SUCCESS, subject.name + ' will now able to use the blinkers.');
    }
}
