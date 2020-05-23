// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Channel } from 'features/communication/channel.js';

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

        // Message to send to players in another virtual world.
        const remoteMessage =
            Message.format(Message.COMMUNICATION_WORLD_MESSAGE, playerColor, player.id,
                           playerVirtualWorld, player.name, message);

        // Message to send to the player, as well as players in the same virtual world.
        const localMessage =
            Message.format(Message.COMMUNICATION_MESSAGE, playerColor, player.id, player.name,
                           message);

        // Fast-path to take in case the |player| is isolated.
        if (player.syncedData.isIsolated()) {
            player.sendMessage(localMessage);
            return;
        }

        for (const recipient of server.playerManager) {
            const recipientMessage =
                this.visibilityManager_.selectMessageForPlayer(
                    player, playerVirtualWorld, recipient, { localMessage, remoteMessage });

            if (recipientMessage)
                recipient.sendMessage(recipientMessage);
        }

        // Distribute the message to people watching on IRC.
        if (VirtualWorld.isMainWorldForCommunication(playerVirtualWorld))
            nuwani.echo('chat', player.id, player.name, message);
        else
            nuwani.echo('chat-world', playerVirtualWorld, player.id, player.name, message);
    }
}
