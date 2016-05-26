// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const CommandBuilder = require('components/command_manager/command_builder.js');

// Here we introduce the manager for the /report-command to give users the ability to send the
// message to the (IRC-)admins.
class ReportCommands {
    constructor(announce) {
        this.announce_ = announce;

        server.commandManager.buildCommand('report')
            .parameters([{ name: 'name/id', type: CommandBuilder.PLAYER_PARAMETER },
                         { name: 'reason', type: CommandBuilder.SENTENCE_PARAMETER }])
            .build(ReportCommands.prototype.onReportPlayerCommand.bind(this))
    }

    onReportPlayerCommand(player, reportedPlayer, reason) {
        this.announce_.announceReportToAdministrators(player, reportedPlayer, reason);

        // Admins already get the notice themselves due to above announce and thus know it already
        if (player.level == Player.LEVEL_ADMINISTRATOR)
            return;

        player.sendMessage(Message.REPORT_MESSAGE, reportedPlayer.name, reportedPlayer.id, reason);
    }

    // Cleans up the state created by this class, i.e. unregisters the commands.
    dispose() {
        server.commandManager.removeCommand('report');
    }
}

exports = ReportCommands;
