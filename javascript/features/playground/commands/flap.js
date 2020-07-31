// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Command } from 'features/playground/command.js';
import { CommandBuilder } from 'components/commands/command_builder.js';

import { random } from 'base/random.js';

// Command: /flap [player] [interval=1000]
export default class FlapCommand extends Command {
    flapping_ = new WeakSet();

    get name() { return 'flap'; }
    get defaultPlayerLevel() { return Player.LEVEL_ADMINISTRATOR; }
    get description() { return `Did you know that cars can fly?`; }

    build(commandBuilder) {
        commandBuilder
            .parameters([
                { name: 'player', type: CommandBuilder.kTypePlayer },
                { name: 'interval', type: CommandBuilder.kTypeNumber, defaultValue: 1000 }])
            .build(FlapCommand.prototype.onFlapCommand.bind(this));
    }

    // Note that this implementation uses pawnInvoke() because the target vehicle may not be owned
    // by the JavaScript code, and the command should work for all vehicles.
    async onFlapCommand(player, target, interval = 1000) {
        if (interval < 100 || interval > 60000) {
            player.sendMessage(Message.COMMAND_ERROR, 'The interval must be between 100 and 60k');
            return;
        }

        if (this.flapping_.has(target)) {
            this.flapping_.delete(target);

            player.sendMessage(Message.COMMAND_SUCCESS, target.name + ' will soon stop flapping.');
            return;
        }

        if (pawnInvoke('GetPlayerVehicleID', 'i', target.id) === 0) {
            player.sendMessage(Message.COMMAND_ERROR, target.name + ' is not driving a vehicle.');
            return;
        }

        this.flapping_.add(target);

        player.sendMessage(Message.COMMAND_SUCCESS, target.name + ' has started flapping! Weeh!');

        do {
            const vehicleId = pawnInvoke('GetPlayerVehicleID', 'i', target.id);
            if (vehicleId === 0) {
                this.flapping_.delete(target); console.log('xx');
                break;
            }

            pawnInvoke(
                'SetVehicleParamsCarDoors', 'iiiii', vehicleId, random(2), random(2), random(2),
                                                                random(2));

            await wait(interval);

        } while (this.flapping_.has(target) && target.isConnected());
    }
}
