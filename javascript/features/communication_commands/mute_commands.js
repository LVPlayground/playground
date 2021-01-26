// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/commands/command_builder.js';

import { relativeTime } from 'base/time.js';

// How frequently, in milliseconds, should the mute manager do a full check?
const kMuteMonitorIntervalMs = 1000;

// Encapsulates a series of commands to do with the ability to mute other players.
export class MuteCommands {
    announce_ = null;
    communication_ = null;
    nuwani_ = null;

    disposed_ = false;
    muted_ = new Set();

    // Gets the MuteManager from the Communication feature, which we service.
    get muteManager() { return this.communication_().muteManager_; }

    constructor(announce, communication, nuwani) {
        this.announce_ = announce;
        this.communication_ = communication;
        this.nuwani_ = nuwani;

        // /mute [player] [duration=3]
        server.commandManager.buildCommand('mute')
            .description('Mute a certain player for a number of minutes.')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([
                { name: 'player', type: CommandBuilder.kTypePlayer },
                { name: 'duration', type: CommandBuilder.kTypeNumber, defaultValue: 3 }])
            .build(MuteCommands.prototype.onMuteCommand.bind(this));

        // /muteirc [on|off]?
        server.commandManager.buildCommand('muteirc')
            .description('Mute (or unmute) communication coming from IRC.')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([{ name: 'on/off', type: CommandBuilder.kTypeText, optional: true }])
            .build(MuteCommands.prototype.onMuteIrcCommand.bind(this));

        // /muted
        server.commandManager.buildCommand('muted')
            .description('Display a list of people who currently are muted.')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .build(MuteCommands.prototype.onMutedCommand.bind(this));

        // /showreport [player]
        server.commandManager.buildCommand('showreport')
            .description('Forcefully tell another player how they should report incidents.')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([{ name: 'player', type: CommandBuilder.kTypePlayer }])
            .build(MuteCommands.prototype.onShowReportCommand.bind(this));

        // /unmute [player]
        server.commandManager.buildCommand('unmute')
            .description('Remove the mute placed on a player.')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([{ name: 'player', type: CommandBuilder.kTypePlayer }])
            .build(MuteCommands.prototype.onUnmuteCommand.bind(this));

        // Start the mute monitor, to inform players and admins about expiring mutes.
        if (!server.isTest())
            this.muteMonitor();
    }

    // ---------------------------------------------------------------------------------------------

    // Executes the mute monitor, which keeps an eye out on existing mutes and sends announcements
    // when they've finished. It runs about a task per second. Not explicitly running in tests.
    async muteMonitor() {
        do {
            const currentMonotonicTime = server.clock.monotonicallyIncreasingTime();
            for (const player of server.playerManager) {
                const playerMuted = this.muteManager.isMuted(player, currentMonotonicTime);

                // If the player is muted, but not known to our |muted| set, add them. If the
                // opposite is true, when they've been unmuted - let them know that too.
                if (playerMuted && !this.muted_.has(player))
                    this.muted_.add(player);
                else if (!playerMuted && this.muted_.has(player)) {
                    this.muted_.delete(player);

                    player.sendMessage(Message.MUTE_UNMUTED_AUTO);

                    this.announce_().announceToAdministrators(
                        Message.MUTE_ADMIN_UNMUTED_AUTO, player.name, player.id);
                }
            }

            // Remove players from the |muted_| set who have disconnected since, to avoid holding a
            // reference to them. All other players will have been handled in the loop above.
            for (const player of this.muted_) {
                if (!player.isConnected())
                    this.muted_.delete(player);
            }

            // Wait for the defined interval, and then just try again.
            await wait(kMuteMonitorIntervalMs);

        } while (!this.disposed_);
    }

    // ---------------------------------------------------------------------------------------------

    // /mute [player] [duration=3]
    //
    // Mutes the given player for the indicated amount of time, in minutes. This will cut off all
    // ways of communication for them, except for administrator chat.
    onMuteCommand(player, targetPlayer, duration = 3) {
        const timeRemaining = this.muteManager.getPlayerRemainingMuteTime(targetPlayer);

        // Send error when player try to mute our bot :-)
        if (targetPlayer.isNonPlayerCharacter()) {
            player.sendMessage(Message.MUTE_NPC);
            return;
         }

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

    // /muteirc [on | off]?
    //
    // Mutes the IRC channel for unregistered people. Useful when someone from IRC is being a troll,
    // without having to switch tabs to mIRC or another client.
    onMuteIrcCommand(player, command) {
        switch (command) {
            case 'on':
                this.nuwani_().echo('mute-echo');
                this.announce_().announceToAdministrators(
                    Message.COMMUNICATION_ADMIN_IRC_MUTE, player.name, player.id, 'muted');

                player.sendMessage(Message.COMMUNICATION_MUTE_IRC_ENABLED);
                break;

            case 'off':
                this.nuwani_().echo('unmute-echo');
                this.announce_().announceToAdministrators(
                    Message.COMMUNICATION_ADMIN_IRC_MUTE, player.name, player.id, 'unmuted');

                player.sendMessage(Message.COMMUNICATION_MUTE_IRC_DISABLED);
                break;

            default:
                player.sendMessage(Message.COMMAND_USAGE, '/muteirc [on | off]');
                break;
        }
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

        // Avoid sending the automated notification as well.
        this.muted_.delete(targetPlayer);

        this.announce_().announceToAdministrators(
            Message.MUTE_ADMIN_UNMUTED, player.name, player.id, targetPlayer.name, targetPlayer.id);

        targetPlayer.sendMessage(Message.MUTE_UNMUTED_TARGET, player.name, player.id);
        player.sendMessage(Message.MUTE_UNMUTED, targetPlayer.name, targetPlayer.id);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.disposed_ = true;

        this.muted_.clear();
        this.muted_ = null;

        server.commandManager.removeCommand('unmute');
        server.commandManager.removeCommand('showreport');
        server.commandManager.removeCommand('muted');
        server.commandManager.removeCommand('muteirc');
        server.commandManager.removeCommand('mute');
    }
}
