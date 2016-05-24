// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const CommandBuilder = require('components/command_manager/command_builder.js');

class ReportCommands {
    constructor(announce) {
        this.announce_ = announce;

        server.commandManager.buildCommand('report')
            .parameters([{ name: 'name/id', type: CommandBuilder.PLAYER_PARAMETER }
                        ,{ name: 'cheat/hack', type: CommandBuilder.SENTENCE_PARAMETER }])
            .build(ReportCommands.prototype.onReportPlayerCommand.bind(this))
    }

    onReportPlayerCommand(player, reportedPlayer, cheatHack) {
        this.announce_.announceReportToAdministrators(player.name, player.id, reportedPlayer.name,
            reportedPlayer.id, cheatHack);

        if (player.level == Player.LEVEL_ADMINISTRATOR)
            return;

        const reportMessage = Message.format(Message.REPORT_MESSAGE, reportedPlayer.name,
            reportedPlayer.id, cheatHack);

        player.sendMessage(reportMessage);
    }

    // Cleans up the state created by this class, i.e. unregisters the commands.
    dispose() {
        server.commandManager.removeCommand('report');
    }
}

exports = ReportCommands;
