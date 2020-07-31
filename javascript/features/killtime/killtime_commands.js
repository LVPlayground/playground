// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/commands/command_builder.js';

// It needs to be possible for admins to start up and end the killtime. By this command we provide this functionality
// including being able to define the length.
class KilltimeCommands {
    constructor(manager) {
        this.manager_ = manager;

        server.commandManager.buildCommand('killtime')
            .description('Manages the kill time feature on the server.')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .sub('start')
                .description('Starts a new kill time with a given weapon.')
                .parameters([{ name: 'minutes', type: CommandBuilder.kTypeNumber, optional: true },
                            { name: 'weapon', type: CommandBuilder.kTypeNumber, optional: true}])
                .build(KilltimeCommands.prototype.onKilltimeStartCommand.bind(this))
            .sub('stop')
                .description('Stops the active kill time.')
                .build(KilltimeCommands.prototype.onKilltimeStopCommand.bind(this))
            .build(KilltimeCommands.prototype.onKilltimeCommand.bind(this));
    }

    onKilltimeStartCommand(player, minutes = 2, weapon) {
        if (minutes < 2) {
            player.sendMessage(Message.KILLTIME_MINIMUM_TWO_MINUTES);
            return;
        }

        if (minutes > 10) {
            player.sendMessage(Message.KILLTIME_MAXIMUM_TEN_MINUTES);
            return;
        }

        if(weapon !== undefined && weapon !== null && !this.manager_.validWeapons.includes(weapon)) {
            player.sendMessage(Message.KILLTIME_INVALID_WEAPON);
            return;
        }

        this.manager_.start(minutes, weapon);
    }

    onKilltimeStopCommand(player) {
        this.manager_.stop(player);
    }

    onKilltimeCommand(player) {
        player.sendMessage(Message.COMMAND_USAGE, Message.KILLTIME_USAGE);
    }

    // Cleans up the state created by this class, i.e. unregisters the commands.
    dispose() {
        server.commandManager.removeCommand('killtime');
    }
}

export default KilltimeCommands;
