// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import CommandBuilder from 'components/command_manager/command_builder.js';

// It needs to be possible for admins to start up and end the killtime. By this command we provide this functionality
// including being able to define the length.
class KilltimeCommands {
    constructor(manager) {
        this.manager_ = manager;

        server.commandManager.buildCommand('killtime')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .sub('start')
                .parameters([{ name: 'minutes', type: CommandBuilder.NUMBER_PARAMETER, optional: true }])
                .build(KilltimeCommands.prototype.onKilltimeStartCommand.bind(this))
            .sub('stop')
                .build(KilltimeCommands.prototype.onKilltimeStopCommand.bind(this))
            .build(KilltimeCommands.prototype.onKilltimeCommand.bind(this));
    }

    onKilltimeStartCommand(player, minutes = 2) {
        if (minutes < 2) {
            player.sendMessage(Message.KILLTIME_MINIMUM_TWO_MINUTES);
            return;
        }

        if (minutes > 10) {
            player.sendMessage(Message.KILLTIME_MAXIMUM_TEN_MINUTES);
            return;
        }

        this.manager_.start(minutes);
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
