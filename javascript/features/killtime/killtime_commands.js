// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const CommandBuilder = require('components/command_manager/command_builder.js');

// Here we introduce the manager for the /report-command to give users the ability to send the
// message to the (IRC-)admins.
class KilltimeCommands {
    constructor() {//announce) {
        //this.announce_ = announce;
        this.showInformationText_ = true;
        this.minutesUntillKilltimeEnds = -1;

        server.commandManager.buildCommand('killtime')
            .restrict(Player.LEVEL_ADMINISTRATOR) // minutes
            .sub(CommandBuilder.NUMBER_PARAMETER)
                .parameters([{ name: 'weaponId', type: CommandBuilder.NUMBER_PARAMETER }])
                .build(KilltimeCommands.prototype.onKilltimeCommandWithParams.bind(this))
            .build(KilltimeCommands.prototype.onKilltimeCommand.bind(this));
    }

    onKilltimeCommandWithParams(player, minutes = 2, weaponId = -1) {

    }

    onKilltimeCommand(player) {
        if (this.showInformationText_) {
            player.sendMessage(Message.KILLTIME_START_STANDARD);
            this.showInformationText_ = false;
        }

        if (this.minutesUntillKilltimeEnds == -1) {
            this.onKilltimeCommandWithParams(player);
            return;
        }

        this.showInformationText_ = true;
    }

    // Cleans up the state created by this class, i.e. unregisters the commands.
    dispose() {
        server.commandManager.removeCommand('killtime');
    }
}

exports = KilltimeCommands;
