// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/commands/command_builder.js';
import { VirtualWorld } from 'entities/virtual_world.js';

import { kMessagePrefixes } from 'base/message.js';
import { relativeTime, toNow } from 'base/time.js';

// Implementation of a series of commands meant for communication between the IRC server and in-game
// players. This ranges from regular messaging that's available for everyone, to specific messages
// intended for specific players or levels.
export class NuwaniCommands {
    commandManager_ = null;

    announce_ = null;
    communication_ = null;
    nuwani_ = null;

    // Map of |nickname| => |NuwaniPlayer| instance for message filtering purposes.
    nuwaniPlayerContext_ = new Map();
    nuwaniPlayers_ = new Map();

    // Gets the MuteManager from the Communication feature, which we service.
    get muteManager() { return this.communication_().muteManager_; }

    constructor(commandManager, announce, communication, nuwani) {
        this.commandManager_ = commandManager;
        this.announce_ = announce;
        this.communication_ = communication;
        this.nuwani_ = nuwani;

        // !admin [message]
        this.commandManager_.buildCommand('admin')
            .description(`Send a message to the in-game administrator chat.`)
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([{ name: 'message', type: CommandBuilder.kTypeText }])
            .build(NuwaniCommands.prototype.onAdminCommand.bind(this));

        // !announce [message]
        this.commandManager_.buildCommand('announce')
            .description(`Send an announcement to in-game players.`)
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([{ name: 'message', type: CommandBuilder.kTypeText }])
            .build(NuwaniCommands.prototype.onAnnounceCommand.bind(this));

        // !discord
        this.commandManager_.buildCommand('discord')
            .description(`Display information about our Discord server.`)
            .build(NuwaniCommands.prototype.onDiscordCommand.bind(this));
        
        // !help
        this.commandManager_.buildCommand('help')
            .description(`Display information about how to use Nuwani.`)
            .build(NuwaniCommands.prototype.onHelpCommand.bind(this));

        // !msg [message]
        this.commandManager_.buildCommand('msg')
            .description(`Send a message to in-game players.`)
            .parameters([{ name: 'message', type: CommandBuilder.kTypeText }])
            .build(NuwaniCommands.prototype.onMessageCommand.bind(this));

        // !muted
        this.commandManager_.buildCommand('muted')
            .description(`Display a list of currently muted players.`)
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .build(NuwaniCommands.prototype.onMutedCommand.bind(this));

        // !mute [player] [duration=2]
        this.commandManager_.buildCommand('mute')
            .description(`Mute one of the currently in-game players.`)
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([
                { name: 'player', type: CommandBuilder.kTypePlayer },
                { name: 'duration', type: CommandBuilder.kTypeNumber, defaultValue: 2 } ])
            .build(NuwaniCommands.prototype.onMuteCommand.bind(this));

        // !pm [player] [message]
        this.commandManager_.buildCommand('pm')
            .description(`Send a private message to an in-game player.`)
            .parameters([
                { name: 'player', type: CommandBuilder.kTypePlayer },
                { name: 'message', type: CommandBuilder.kTypeText } ])
            .build(NuwaniCommands.prototype.onPrivageMessageCommand.bind(this));

        // !say [message]
        this.commandManager_.buildCommand('say')
            .description(`Send an informal announcement to in-game players.`)
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([{ name: 'message', type: CommandBuilder.kTypeText }])
            .build(NuwaniCommands.prototype.onSayCommand.bind(this));

        // !unmute [player]
        this.commandManager_.buildCommand('unmute')
            .description(`Revoke a mute on one of the in-game players.`)
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([{ name: 'player', type: CommandBuilder.kTypePlayer }])
            .build(NuwaniCommands.prototype.onUnmuteCommand.bind(this));

        // !vip [message]
        this.commandManager_.buildCommand('vip')
            .description(`Send a message to all in-game VIPs.`)
            .parameters([{ name: 'message', type: CommandBuilder.kTypeText }])
            .build(NuwaniCommands.prototype.onVipMessageCommand.bind(this));
    }

    // ---------------------------------------------------------------------------------------------
    
    // Utility function to filter messages prior to sending them out to people on the server. These
    // routines were designed and are optimised for in-game players, so we pretend to be one.
    processForDistribution(context, message) {
        const contextMap = this.nuwaniPlayerContext_;
        const nickname = context.nickname;

        // Ensure that a fake NuwaniPlayer exists for the given |nickname|, which enables us to
        // communicate with them in the same way we'd normally communicate with players.
        if (!this.nuwaniPlayers_.has(nickname)) {
            this.nuwaniPlayers_.set(nickname, new class {
                account = { mutedUntil: null };
                name = nickname;

                sendMessage(message) {
                    contextMap.get(nickname).respond(
                        String(message).replace(kMessagePrefixes.error, '4Error: '));
                }
            });
        }

        // Store the |context| so that it can be properly applied in sharing errors, process the
        // message, and then clear the context again so that we're not holding on to it.
        let processedMessage = null;
        {
            this.nuwaniPlayerContext_.set(nickname, context);

            processedMessage =
                this.communication_().processForDistribution(
                    this.nuwaniPlayers_.get(nickname), message);
                
            this.nuwaniPlayerContext_.delete(nickname);
        }

        return processedMessage;
    }

    // ---------------------------------------------------------------------------------------------

    // !admin [message]
    //
    // Sends a message to the in-game administrator chat, reaching all in-game crew.
    onAdminCommand(context, message) {
        let prefix = '';

        switch (context.level) {
            case Player.LEVEL_MANAGEMENT:
                prefix = 'Manager';
                break;
            case Player.LEVEL_ADMINISTRATOR:
                prefix = 'Admin';
                break;
            default:
                throw new Error('Unexpected level to label: ' + context.level);
        }

        const processedMessage = this.processForDistribution(context, message);
        if (!processedMessage)
            return;

        const formattedMessage =
            Message.format(Message.IRC_ADMIN_MESSAGE, prefix, context.nickname, processedMessage);
        
        server.playerManager.forEach(player => {
            if (player.isAdministrator())
                player.sendMessage(formattedMessage);
        });

        this.nuwani_().echo('chat-admin-irc', context.nickname, processedMessage);
    }

    // !announce [message]
    //
    // Sends a formal announcement to all in-game players. Command is restricted to administrators.
    // No players will be excluded, regardless of activity.
    onAnnounceCommand(context, message) {
        const processedMessage = this.processForDistribution(context, message);
        if (!processedMessage)
            return;

        const formattedMessages = [
            Message.IRC_ANNOUNCE_DIVIDER,
            Message.format(Message.IRC_ANNOUNCE_MESSAGE, processedMessage),
            Message.IRC_ANNOUNCE_DIVIDER,
        ];

        server.playerManager.forEach(player => {
            for (const formattedMessage of formattedMessages)
                player.sendMessage(formattedMessage);
        });

        this.announce_().announceToAdministrators(Message.IRC_ANNOUNCE_ADMIN, context.nickname);
        this.nuwani_().echo('notice-announce', processedMessage);

        context.respond('3Success: The announcement has been published.');
    }

    // !discord
    //
    // Displays information on how people can join our Discord channel.
    onDiscordCommand(context) {
        context.respond('5LVP Discord: https://discord.sa-mp.nl/');
    }

    // !help
    //
    // Displays information on how people can use Nuwani on IRC.
    onHelpCommand(context) {
        context.respond(
            '5Available IRC commands: !getid, !getname, !msg, !players, !pm, !vip, !discord');

        context.respond(
            'Register for an account on https://sa-mp.nl/, and use the in-game "5/account" ' +
            'command to change your name, password and settings.');
    }

    // !msg [message]
    //
    // Sends a regular message to in-game players who are in the main world. Everyone is able to
    // send those messages, not just administrators and up.
    onMessageCommand(context, message) {
        if (!context.inEchoChannel())
            return;  // only available in the echo channel

        const processedMessage = this.processForDistribution(context, message);
        if (!processedMessage)
            return;

        const formattedMessage =
            Message.format(Message.IRC_MESSAGE, context.nickname, processedMessage);

        server.playerManager.forEach(player => {
            if (VirtualWorld.isMainWorld(player.virtualWorld))
                player.sendMessage(formattedMessage);
        });

        this.nuwani_().echo('chat-from-irc', context.nickname, processedMessage);
    }

    // !muted
    //
    // Lists the players who are currently muted in-game. The players will be listed in ascending
    // order of remaining duration on their mute.
    onMutedCommand(context) {
        const muted = [];

        for (const player of server.playerManager) {
            const remainingDuration = this.muteManager.getPlayerRemainingMuteTime(player);
            if (remainingDuration)
                muted.push({ player, remainingDuration });
        }

        if (!muted.length) {
            context.respond('5Result: Nobody is muted right now.');
            return;
        }

        // Sort |muted| based on the remaining duration, in ascending order.
        muted.sort((lhs, rhs) => {
            if (lhs.remainingDuration === rhs.remainingDuration)
                return 0;

            return lhs.remainingDuration > rhs.remainingDuration ? 1 : -1;
        });

        // Split the response up in one message per ten muted players. That will fit comfortably,
        // while using multiple messages to increase clarity where appropriate.
        while (muted.length) {
            let players = [];

            for (const { player, remainingDuration } of muted.splice(0, 10)) {
                const remaining = toNow({ date: new Date(Date.now() - remainingDuration * 1000 )});
                players.push(`${player.name} 14(expires ${remaining})`);
            }

            context.respond(`'5Muted players: ${players.join(', ')}`);
        }
    }

    // !mute [player] [duration=2]
    //
    // Mutes the given |player| for the given |duration|. No reason will be given, the administrator
    // is expected to send a message to the |player| separately.
    onMuteCommand(context, player, duration = 2) {
        const timeRemaining = this.muteManager.getPlayerRemainingMuteTime(player);

        const proposedTime = duration * 60;
        const proposedText = relativeTime({
            date1: new Date(),
            date2: new Date(Date.now() + proposedTime * 1000)
        }).text;

        this.muteManager.mutePlayer(player, proposedTime);

        if (!timeRemaining) {
            player.sendMessage(Message.MUTE_MUTED_TARGET_IRC, context.nickname, proposedText);
        } else {
            const change = timeRemaining >= proposedTime ? 'decreased' : 'extended';

            // Inform the |player| about their punishment having changed.
            player.sendMessage(
                Message.MUTE_MUTED_TARGET_UPDATE_IRC, context.nickname, change, proposedText);
        }

        this.announce_().announceToAdministrators(
            Message.MUTE_ADMIN_MUTED_IRC, context.nickname, player.name, player.id, proposedText);

        context.respond(`3Success: ${player.name} has been muted for ${proposedText}.`);
    }

    // !pm [player] [message]
    //
    // Sends a private message that only the |player| and in-game crew can read. May be sent from
    // any channel, as the contents don't necessarily have to be public.
    onPrivageMessageCommand(context, player, message) {
        const processedMessage = this.processForDistribution(context, message);
        if (!processedMessage)
            return;

        player.sendMessage(
            Message.format(
                Message.COMMUNICATION_PM_IRC_RECEIVER, context.nickname, processedMessage));
        
        const adminAnnouncement =
            Message.format(Message.COMMUNICATION_IRC_PM_ADMIN, context.nickname, player.name,
                           player.id, processedMessage);

        server.playerManager.forEach(player => {
            if (player.isAdministrator())
                player.sendMessage(adminAnnouncement);
        });
        
        this.nuwani_().echo(
            'chat-private-irc', context.nickname, player.name, player.id, processedMessage);
        
        context.respond(`3Success: Your message has been sent to ${player.name}`);
        dispatchEvent('ircmessage', {
            playerid: player.id,
            username: context.nickname,
        });
    }

    // !say [message]
    //
    // Sends a highlighted message to all in-game players. Command is restricted to administrators.
    onSayCommand(context, message) {
        const processedMessage = this.processForDistribution(context, message);
        if (!processedMessage)
            return;

        const formattedMessage =
            Message.format(Message.IRC_SAY_MESSAGE, context.nickname, processedMessage);

        server.playerManager.forEach(player =>
            player.sendMessage(formattedMessage));

        this.nuwani_().echo('notice-say', context.nickname, processedMessage);

        context.respond('3Success: The message has been published.');
    }

    // !unmute [player]
    //
    // Revokes any mute that's active for the given |player|.
    onUnmuteCommand(context, player) {
        const timeRemaining = this.muteManager.getPlayerRemainingMuteTime(player);
        if (!timeRemaining) {
            context.respond(`4Error: ${player.name} is not muted right now.`);
            return;
        }

        this.muteManager.unmutePlayer(player);

        this.announce_().announceToAdministrators(
            Message.MUTE_ADMIN_UNMUTED_IRC, context.nickname, player.name, player.id);

        player.sendMessage(Message.MUTE_UNMUTED_TARGET_IRC, context.nickname);

        context.respond(`3Success: ${player.name} has been unmuted.`);
    }

    // !vip [message]
    //
    // Sends a message to all in-game VIP players. Only VIPs on IRC are able to send these messages,
    // and can see all chatter as well through their channel status.
    onVipMessageCommand(context, message) {
        if (!context.inEchoChannel())
            return;  // only available in the echo channel

        if (!context.isVip()) {
            context.respond(`4Error: Sorry, this command is only available to VIPs.`);
            return;
        }

        const processedMessage = this.processForDistribution(context, message);
        if (!processedMessage)
            return;

        const formattedMessage =
            Message.format(Message.IRC_VIP_MESSAGE, context.nickname, processedMessage);

        server.playerManager.forEach(player => {
            if (player.isVip())
                player.sendMessage(formattedMessage);
        });

        this.nuwani_().echo('chat-vip-irc', context.nickname, processedMessage);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.commandManager_.removeCommand('vip');
        this.commandManager_.removeCommand('unmute');
        this.commandManager_.removeCommand('say');
        this.commandManager_.removeCommand('pm');
        this.commandManager_.removeCommand('mute');
        this.commandManager_.removeCommand('muted');
        this.commandManager_.removeCommand('msg');
        this.commandManager_.removeCommand('help');
        this.commandManager_.removeCommand('discord');
        this.commandManager_.removeCommand('announce');
        this.commandManager_.removeCommand('admin');
    }
}
