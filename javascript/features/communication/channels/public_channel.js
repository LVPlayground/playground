// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Channel } from 'features/communication/channel.js';

// The public communication channel. By default players will be divided based on the Virtual World
// that they're part of, but individual settings are able to override that.
export class PublicChannel extends Channel {
    confirmChannelAccessForPlayer(player) { return true; }

    // Distributes the |message| as sent by |player| to the appropriate set of recipients.
    distribute(player, message, nuwani) {
        const playerColor = player.color.toHexRGB();

        const playerVirtualWorld = player.virtualWorld;
        const playerInMainWorld = VirtualWorld.isMainWorldForCommunication(playerVirtualWorld);
        const playerIsAdministrator = player.isAdministrator();

        // Message to send to players in another virtual world.
        const formattedCrossWorldMessage =
            Message.format(Message.COMMUNICATION_WORLD_MESSAGE, playerColor, player.id,
                           playerVirtualWorld, player.name, message);

        // Message to send to the player, as well as players in the same virtual world.
        const formattedSameWorldMessage =
            Message.format(Message.COMMUNICATION_MESSAGE, playerColor, player.id, player.name,
                           message);

        // Fast-path to take in case the |player| is isolated.
        if (player.syncedData.isIsolated()) {
            player.sendMessage(formattedSameWorldMessage);
            return;
        }

        for (const recipient of server.playerManager) {
            const recipientVirtualWorld = recipient.virtualWorld;
            const recipientInMainWorld =
                VirtualWorld.isMainWorldForCommunication(recipientVirtualWorld);

            // Whether the |recipient| and the |player| are considered to be in the same world.
            const sameWorld = (recipientInMainWorld && playerInMainWorld) ||
                              (recipientVirtualWorld === playerVirtualWorld);

            if (sameWorld)
                recipient.sendMessage(formattedSameWorldMessage);
            else if (recipient.isAdministrator())
                recipient.sendMessage(formattedCrossWorldMessage);
        }

        // Distribute the message to people watching on IRC.
        if (playerInMainWorld)
            nuwani.echo('chat', player.id, player.name, message);
        else
            nuwani.echo('chat-world', playerVirtualWorld, player.id, player.name, message);
    }
}
