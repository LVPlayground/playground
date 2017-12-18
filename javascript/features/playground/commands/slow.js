// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Command from 'features/playground/command.js';
import CommandBuilder from 'components/command_manager/command_builder.js';

// Command: /slow [player]? [factor]
class SlowCommand extends Command {
    constructor(...args) {
        super(...args);

        // Map containing all the players who are currently being slowed, and whether this should
        // continue (typing /slow on a player twice will stop them from being slowed down further).
        this.slowing_ = new Map();
    }

    get name() { return 'slow'; }
    get defaultPlayerLevel() { return Player.LEVEL_MANAGEMENT; }

    build(commandBuilder) {
        commandBuilder
            .parameters([
                { name: 'target', type: CommandBuilder.PLAYER_PARAMETER, optional: true },
                { name: 'factor', type: CommandBuilder.NUMBER_PARAMETER, optional: true }
            ])
            .build(SlowCommand.prototype.onSlowCommand.bind(this));
    }

    async onSlowCommand(player, target, inputFactor) {
        const subject = target instanceof Player ? target : player;
        const factor = target instanceof Player ? (inputFactor || 1.5) : 0.09;

        const name = subject === player ? 'You' : subject.name;

        if (!(subject instanceof Player)) {
            player.sendMessage(Message.COMMAND_USAGE, '/slow [player?] [factor]');
            return;
        }

        if (this.slowing_.has(subject)) {
            this.slowing_.set(subject, false);

            player.sendMessage(
                Message.COMMAND_SUCCESS, name + ' will momentarily stop being slowed down.');
            return;
        }

        if (subject === player)
            player.sendMessage(Message.COMMAND_SUCCESS, 'You are about to be slowed down!');
        else
            player.sendMessage(Message.COMMAND_SUCCESS, name + ' is about to slow down.');

        this.slowing_.set(subject, true);

        while (this.slowing_.get(subject) && subject.isConnected()) {
            const vehicleId = pawnInvoke('GetPlayerVehicleID', 'i', subject.id);
            if (vehicleId >= 0 && vehicleId <= 2000) {
                const velocity = new Vector(...pawnInvoke('GetVehicleVelocity', 'iFFF', vehicleId));

                pawnInvoke('SetVehicleVelocity', 'ifff', vehicleId, velocity.x * factor,
                                                         velocity.y * factor, velocity.z);
            }

            await milliseconds(500);
        }

        this.slowing_.delete(subject);
    }
}

export default SlowCommand;
