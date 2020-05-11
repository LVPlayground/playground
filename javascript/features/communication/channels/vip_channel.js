// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Channel } from 'features/communication/channel.js';

// Private communication channel intended for VIPs. Identified by a unique prefix (`#`). Only VIPs
// are able to read and write messages to this channel, others will be shown an error.
export class VipChannel extends Channel {
    getPrefix() { return '#'; }

    // Only VIPs are allowed to write to the VIP channel. Other players get an error message.
    confirmChannelAccessForPlayer(player) {
        if (player.isVip())
            return true;
        
        player.sendMessage(Message.COMMUNICATION_VIP_NO_ACCESS);
        return false;
    }

    // Distributes the |message| as sent by |player| to the recipients of this channel.
    distribute(player, message, nuwani) {
        const formattedMessage =
            Message.format(Message.COMMUNICATION_VIP_MESSAGE, player.id, player.name, message);

        // Fast-path to take in case the |player| is isolated.
        if (player.syncedData.isIsolated()) {
            player.sendMessage(formattedMessage);
            return;
        }

        for (const recipient of server.playerManager) {
            if (!recipient.isVip())
                continue;  // only VIPs may receive these messages

            recipient.sendMessage(formattedMessage);
        }

        nuwani.echo('chat-vip', player.id, player.name, message);
    }
}
