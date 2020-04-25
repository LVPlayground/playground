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

        // TODO: !pm [player] [message]
        // TODO: !msg [message]

        // !say [message]
        this.commandManager_.buildCommand('say')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([{ name: 'message', type: CommandBuilder.SENTENCE_PARAMETER }])
            .build(CommunicationCommands.prototype.onSayCommand.bind(this));

        // TODO: !vip [message]
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

    dispose() {
        this.commandManager_.removeCommand('say');
        this.commandManager_.removeCommand('announce');
        this.commandManager_.removeCommand('admin');
    }
}
