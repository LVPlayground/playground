// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/command_manager/command_builder.js';

// Implementation of a series of commands meant for communication between the IRC server and in-game
// players. This ranges from regular messaging that's available for everyone, to specific messages
// intended for specific players or levels.
export class CommunicationCommands {
    commandManager_ = null;

    constructor(commandManager, announce, nuwani) {
        this.commandManager_ = commandManager;
        this.announce_ = announce;
        this.nuwani_ = nuwani;

        // !admin [message]
        this.commandManager_.buildCommand('admin')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([{ name: 'message', type: CommandBuilder.SENTENCE_PARAMETER }])
            .build(CommunicationCommands.prototype.onAdminCommand.bind(this));

        // !announce [message]
        this.commandManager_.buildCommand('announce')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([{ name: 'message', type: CommandBuilder.SENTENCE_PARAMETER }])
            .build(CommunicationCommands.prototype.onAnnounceCommand.bind(this));

        // !msg [message]
        this.commandManager_.buildCommand('msg')
            .parameters([{ name: 'message', type: CommandBuilder.SENTENCE_PARAMETER }])
            .build(CommunicationCommands.prototype.onMessageCommand.bind(this));

        // !pm [player] [message]
        this.commandManager_.buildCommand('pm')
            .parameters([
                { name: 'player', type: CommandBuilder.PLAYER_PARAMETER },
                { name: 'message', type: CommandBuilder.SENTENCE_PARAMETER } ])
            .build(CommunicationCommands.prototype.onPrivageMessageCommand.bind(this));

        // !say [message]
        this.commandManager_.buildCommand('say')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([{ name: 'message', type: CommandBuilder.SENTENCE_PARAMETER }])
            .build(CommunicationCommands.prototype.onSayCommand.bind(this));

        // !vip [message]
        this.commandManager_.buildCommand('vip')
            .restrict(CommunicationCommands.isVipContext)
            .parameters([{ name: 'message', type: CommandBuilder.SENTENCE_PARAMETER }])
            .build(CommunicationCommands.prototype.onVipMessageCommand.bind(this));
    }
    
    // !admin [message]
    //
    // Sends a message to the in-game administrator chat, reaching all in-game crew.
    onAdminCommand(context, message) {
        const prefix =
            context.getSenderModesInEchoChannel().includes('a') ? 'Manager'
                                                                : 'Admin';

        const formattedMessage =
            Message.format(Message.IRC_ADMIN_MESSAGE, prefix, context.nickname, message);
        
        server.playerManager.forEach(player => {
            if (player.isAdministrator())
                player.sendMessage(formattedMessage);
        });

        this.nuwani_().echo('chat-admin-irc', context.nickname, message);
    }

    // !announce [message]
    //
    // Sends a formal announcement to all in-game players. Command is restricted to administrators.
    // No players will be excluded, regardless of activity.
    onAnnounceCommand(context, message) {
        const formattedMessages = [
            Message.IRC_ANNOUNCE_DIVIDER,
            Message.format(Message.IRC_ANNOUNCE_MESSAGE, message),
            Message.IRC_ANNOUNCE_DIVIDER,
        ];

        server.playerManager.forEach(player => {
            for (const formattedMessage of formattedMessages)
                player.sendMessage(formattedMessage);
        });

        this.announce_().announceToAdministrators(Message.IRC_ANNOUNCE_ADMIN, context.nickname);
        this.nuwani_().echo('notice-announce', message);

        context.respond('3Success: The announcement has been published.');
    }

    // !msg [message]
    //
    // Sends a regular message to in-game players who are in the main world. Everyone is able to
    // send those messages, not just administrators and up.
    onMessageCommand(context, message) {
        if (!context.inEchoChannel())
            return;  // only available in the echo channel

        const formattedMessage = Message.format(Message.IRC_MESSAGE, context.nickname, message);

        server.playerManager.forEach(player => {
            if (VirtualWorld.isMainWorld(player.virtualWorld))
                player.sendMessage(formattedMessage);
        });

        this.nuwani_().echo('chat-from-irc', context.nickname, message);
    }

    // !pm [player] [message]
    //
    // Sends a private message that only the |player| and in-game crew can read. May be sent from
    // any channel, as the contents don't necessarily have to be public.
    onPrivageMessageCommand(context, player, message) {
        player.sendMessage(
            Message.format(Message.IRC_PRIVATE_MESSAGE, context.nickname, message));
        
        const adminAnnouncement =
            Message.format(Message.IRC_PRIVATE_MESSAGE_ADMIN, context.nickname, player.name,
                           player.id, message);

        server.playerManager.forEach(player => {
            if (player.isAdministrator())
                player.sendMessage(adminAnnouncement);
        });
        
        this.nuwani_().echo(
            'chat-private-irc', context.nickname, player.name, player.id, message);
        
        context.respond(`3Success: Your message has been sent to ${player.name}`);
    }

    // !say [message]
    //
    // Sends a highlighted message to all in-game players. Command is restricted to administrators.
    onSayCommand(context, message) {
        const formattedMessage = Message.format(Message.IRC_SAY_MESSAGE, context.nickname, message);
        server.playerManager.forEach(player =>
            player.sendMessage(formattedMessage));

        this.nuwani_().echo('notice-say', context.nickname, message);

        context.respond('3Success: The message has been published.');
    }

    // !vip [message]
    //
    // Sends a message to all in-game VIP players. Only VIPs on IRC are able to send these messages,
    // and can see all chatter as well through their channel status.
    onVipMessageCommand(context, message) {
        if (!context.inEchoChannel())
            return;  // only available in the echo channel

        const formattedMessage = Message.format(Message.IRC_VIP_MESSAGE, context.nickname, message);

        server.playerManager.forEach(player => {
            if (player.isVip())
                player.sendMessage(formattedMessage);
        });

        this.nuwani_().echo('chat-vip-irc', context.nickname, message);
    }

    // Returns whether the |context| describes a user who's been marked as a VIP on IRC. We
    // determine this by the user having "+v" mode in the echo channel.
    static isVipContext(context) {
        const status = context.getSenderModesInEchoChannel();
        return typeof status === 'string' && status.includes('v');
    }

    dispose() {
        this.commandManager_.removeCommand('vip');
        this.commandManager_.removeCommand('say');
        this.commandManager_.removeCommand('pm');
        this.commandManager_.removeCommand('msg');
        this.commandManager_.removeCommand('announce');
        this.commandManager_.removeCommand('admin');
    }
}
