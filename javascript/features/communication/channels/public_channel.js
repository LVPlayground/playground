// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Channel } from 'features/communication/channel.js';

// Regular expression to grep nicknames from the public chat message.
const kMentionExpression = /(?<!\w)@([0-9a-z\[\]\(\)\$@_=]{3,24})/gi;

// Id of the sound to play when a player has been mentioned in chat.
const kMentionSound = 1058;

// The public communication channel. By default players will be divided based on the Virtual World
// that they're part of, but individual settings are able to override that.
export class PublicChannel extends Channel {
    visibilityManager_ = null;

    constructor(visibilityManager) {
        super();

        this.visibilityManager_ = visibilityManager;
    }

    confirmChannelAccessForPlayer(player) { return true; }

    // Distributes the |message| as sent by |player| to the appropriate set of recipients.
    distribute(player, message, nuwani) {
        const playerColor = player.color.toHexRGB();
        const playerVirtualWorld = player.virtualWorld;

        const mentioned = new Set();

        // Enables players to mention each other by using @Nick. This will highlight the mention in
        // the chat, and play a beep to the other player when they're not ignoring each other.
        const richMessage = message.replace(kMentionExpression, mention => {
            const mentionedPlayer = server.playerManager.getByName(mention.substring(1), true);
            if (!mentionedPlayer || mentionedPlayer === player)
                return mention;  // invalid player, or a self-mention

            mentioned.add(mentionedPlayer);

            return `{${mentionedPlayer.color.toHexRGB()}}${mention}{FFFFFF}`;
        });

        // Message to send to players in another virtual world.
        const remoteMessage =
            Message.format(Message.COMMUNICATION_WORLD_MESSAGE, playerColor, player.id,
                           playerVirtualWorld, player.name, richMessage);

        // Message to send to the player, as well as players in the same virtual world.
        const localMessage =
            Message.format(Message.COMMUNICATION_MESSAGE, playerColor, player.id, player.name,
                           richMessage);

        // Fast-path to take in case the |player| is isolated.
        if (player.syncedData.isIsolated()) {
            player.sendMessage(localMessage);
            return;
        }

        for (const recipient of server.playerManager) {
            const recipientMessage =
                this.visibilityManager_.selectMessageForPlayer(
                    player, playerVirtualWorld, recipient, { localMessage, remoteMessage });

            if (!recipientMessage)
                continue;

            if (mentioned.has(recipient))
                recipient.playSound(kMentionSound);

            recipient.sendMessage(recipientMessage);
        }

        // Distribute the message to people watching on IRC.
        if (VirtualWorld.isMainWorldForCommunication(playerVirtualWorld))
            nuwani.echo('chat', player.id, player.name, message);
        else
            nuwani.echo('chat-world', playerVirtualWorld, player.id, player.name, message);
    }
}
