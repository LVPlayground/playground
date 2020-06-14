// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/command_manager/command_builder.js';

// Here we introduce the manager for the /report-command to give users the ability to send the
// message to the (IRC-)admins.
class ReportCommands {
    constructor(announce, nuwani) {
        this.announce_ = announce;
        this.nuwani_ = nuwani;

        this.reportedPlayersWeakMap_ = new WeakMap();

        server.commandManager.buildCommand('report')
            .parameters([{ name: 'name/id', type: CommandBuilder.PLAYER_PARAMETER },
                         { name: 'reason', type: CommandBuilder.SENTENCE_PARAMETER }])
            .build(ReportCommands.prototype.onReportPlayerCommand.bind(this));
    }

    playerIsReportedOneMinuteAgoOrLess(reportedPlayer) {
        return this.reportedPlayersWeakMap_.has(reportedPlayer) &&
               server.clock.monotonicallyIncreasingTime() -
                   this.reportedPlayersWeakMap_.get(reportedPlayer) < 60000;
    }

    onReportPlayerCommand(player, reportedPlayer, reason) {
        if (this.playerIsReportedOneMinuteAgoOrLess(reportedPlayer)) {
            player.sendMessage(Message.REPORT_ALREADY_REPORTED, reportedPlayer.name);
            return;
        } else {
            this.reportedPlayersWeakMap_.set(
                reportedPlayer, server.clock.monotonicallyIncreasingTime());
        }

        this.announce_().announceReportToAdministrators(player, reportedPlayer, reason);
        this.nuwani_().echo(
            'report', player.name, player.id, reportedPlayer.name, reportedPlayer.id, reason);
        
        // Admins already get the notice themselves due to above announce and thus know it already
        if (player.isAdministrator())
            return;

        player.sendMessage(Message.REPORT_MESSAGE, reportedPlayer.name, reportedPlayer.id, reason);
    }

    // Cleans up the state created by this class, i.e. unregisters the commands.
    dispose() {
        server.commandManager.removeCommand('report');
    }
}

export default ReportCommands;
