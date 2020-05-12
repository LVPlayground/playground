// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import CommandBuilder from 'components/command_manager/command_builder.js';
import Feature from 'components/feature_manager/feature.js';

import { relativeTime } from 'base/time.js';

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
        const timeRemaining = this.muteManager.getPlayerRemainingMuteTime(targetPlayer);

        const proposedTime = duration * 60;
        const proposedText = relativeTime({
            date1: new Date(),
            date2: new Date(Date.now() + proposedTime * 1000 )
        }).text;

        this.muteManager.mutePlayer(targetPlayer, proposedTime);

        if (!timeRemaining) {
            targetPlayer.sendMessage(
                Message.MUTE_MUTED_TARGET, player.name, player.id, proposedText);
        } else {
            const change = timeRemaining >= proposedTime ? 'decreased' : 'extended';

            // Inform the |targetPlayer| about their punishment having changed.
            targetPlayer.sendMessage(
                Message.MUTE_MUTED_TARGET_UPDATE, player.name, player.id, change, proposedText);
        }

        this.announce_().announceToAdministrators(
            Message.MUTE_ADMIN_MUTED, player.name, player.id, targetPlayer.name, targetPlayer.id,
            proposedText);

        player.sendMessage(Message.MUTE_MUTED, targetPlayer.name, targetPlayer.id, proposedText);
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
        let hasMutedPlayers = false;

        for (const otherPlayer of server.playerManager) {
            const remainingTime = this.muteManager.getPlayerRemainingMuteTime(otherPlayer);
            if (!remainingTime)
                continue;

            hasMutedPlayers = true;

            const duration = relativeTime({
                date1: new Date(),
                date2: new Date(Date.now() + remainingTime * 1000 )
            }).text;

            player.sendMessage(Message.MUTE_MUTED_LIST, otherPlayer.name, otherPlayer.id, duration);
        }

        if (!hasMutedPlayers)
            player.sendMessage(Message.MUTE_MUTED_NOBODY);
    }

    // /showreport [player]
    //
    // Shows a message to the given player on how to report players in the future, and mutes them
    // automatically for two minutes to make sure that they get the point.
    onShowReportCommand(player, targetPlayer) {
        const timeRemaining = this.muteManager.getPlayerRemainingMuteTime(targetPlayer);
        if (timeRemaining > 0) {
            player.sendMessage(
                Message.MUTE_SHOW_REPORT_ALREADY_MUTED, targetPlayer.name, targetPlayer.id);
            return;
        }

        const kDurationSeconds = 120;
        const kDuration = '2 minutes';

        this.muteManager.mutePlayer(targetPlayer, kDurationSeconds);

        // Inform the |targetPlayer| about how to report, as well as their punishment.
        targetPlayer.sendMessage(Message.MUTE_SHOW_REPORT_BORDER);
        targetPlayer.sendMessage(
            Message.MUTE_SHOW_REPORT_MESSAGE_1, player.name, player.id, kDuration);
        targetPlayer.sendMessage(Message.MUTE_SHOW_REPORT_MESSAGE_2);
        targetPlayer.sendMessage(Message.MUTE_SHOW_REPORT_BORDER);

        // Inform in-game administrators and the |player| themselves of the mute.
        this.announce_().announceToAdministrators(
            Message.MUTE_ADMIN_MUTED, player.name, player.id, targetPlayer.name, targetPlayer.id,
            kDuration);

        player.sendMessage(Message.MUTE_MUTED, targetPlayer.name, targetPlayer.id, kDuration);
    }

    // /unmute [player]
    //
    // Immediately unmutes the given player for an unspecified reason. They'll be able to use all
    // forms of communication on the server again.
    onUnmuteCommand(player, targetPlayer) {
        const timeRemaining = this.muteManager.getPlayerRemainingMuteTime(targetPlayer);
        if (!timeRemaining) {
            player.sendMessage(Message.MUTE_UNMUTE_NOT_MUTED, targetPlayer.name, targetPlayer.id);
            return;
        }

        this.muteManager.unmutePlayer(targetPlayer);

        this.announce_().announceToAdministrators(
            Message.MUTE_ADMIN_UNMUTED, player.name, player.id, targetPlayer.name, targetPlayer.id);

        targetPlayer.sendMessage(Message.MUTE_UNMUTED_TARGET, player.name, player.id);
        player.sendMessage(Message.MUTE_UNMUTED, targetPlayer.name, targetPlayer.id);
    }

    dispose() {
        server.commandManager.removeCommand('unmute');
        server.commandManager.removeCommand('showreport');
        server.commandManager.removeCommand('muted');
        server.commandManager.removeCommand('muteall');
        server.commandManager.removeCommand('mute');
    }
}
