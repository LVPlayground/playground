// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import CommandBuilder from 'components/command_manager/command_builder.js';
import Feature from 'components/feature_manager/feature.js';

// Provides a series of commands associated with communication on Las Venturas Playground. These
// commands directly serve the Communication feature, but require a dependency on the `announce`
// feature which is prohibited given that Communication is a foundational feature.
export default class CommunicationCommands extends Feature {
    announce_ = null;
    communication_ = null;

    // Gets the MuteManager from the Communication feature, which we service.
    get muteManager() { return this.communication_().muteManager_; }

    constructor() {
        super();

        this.announce_ = this.defineDependency('announce');
        this.communication_ = this.defineDependency('communication');

        // /mute [player] [duration=3]
        server.commandManager.buildCommand('mute')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([
                { name: 'player', type: CommandBuilder.PLAYER_PARAMETER },
                { name: 'duration', type: CommandBuilder.NUMBER_PARAMETER, optional: true }])
            .build(CommunicationCommands.prototype.onMuteCommand.bind(this));

        // /muteall [on/off]
        server.commandManager.buildCommand('muteall')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([{ name: 'on/off', type: CommandBuilder.WORD_PARAMETER }])
            .build(CommunicationCommands.prototype.onMuteAllCommand.bind(this));

        // /muted
        server.commandManager.buildCommand('muted')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .build(CommunicationCommands.prototype.onMutedCommand.bind(this));

        // /showreport
        server.commandManager.buildCommand('showreport')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([{ name: 'player', type: CommandBuilder.PLAYER_PARAMETER }])
            .build(CommunicationCommands.prototype.onShowReportCommand.bind(this));

        // /unmute [player]
        server.commandManager.buildCommand('unmute')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([{ name: 'player', type: CommandBuilder.PLAYER_PARAMETER }])
            .build(CommunicationCommands.prototype.onUnmuteCommand.bind(this));
    }

    // /mute [player] [duration=3]
    //
    // Mutes the given player for the indicated amount of time, in minutes. This will cut off all
    // ways of communication for them, except for administrator chat.
    onMuteCommand(player, targetPlayer, duration = 3) {

    }

    // /muteall [on/off]
    //
    // Enables the player to mute all communications on the server, except for other administrators.
    // This should rarely be used, only in cases where there are major incidents.
    onMuteAllCommand(player) {

    }

    // /muted
    //
    // Displays an overview of the currently muted players to |player|, and how much time they have
    // left before they automatically get unmuted.
    onMutedCommand(player) {

    }

    // /showreport [player]
    //
    // Shows a message to the given player on how to report players in the future, and mutes them
    // automatically for two minutes to make sure that they get the point.
    onShowReportCommand(player, targetPlayer) {

    }

    // /unmute [player]
    //
    // Immediately unmutes the given player for an unspecified reason. They'll be able to use all
    // forms of communication on the server again.
    onUnmuteCommand(player, targetPlayer) {

    }

    dispose() {
        server.commandManager.removeCommand('unmute');
        server.commandManager.removeCommand('showreport');
        server.commandManager.removeCommand('muted');
        server.commandManager.removeCommand('muteall');
        server.commandManager.removeCommand('mute');
    }
}
