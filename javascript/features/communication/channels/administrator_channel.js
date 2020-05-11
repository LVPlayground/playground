// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Channel } from 'features/communication/channel.js';

// Personalized prefixes issued to certain players. Keyed on their user Id.
const kPersonalizedPrefixes = new Map([
    [ 29685 /* TEF */,  'The' ],
    [ 31797 /* Luce */, 'Lady' ],
]);

// Private communication channel intended for administrators. Identified by a unique prefix (`@`).
// Only administrators are able to read this channel, but everyone can write messages to it.
export class AdministratorChannel extends Channel {
    getPrefix() { return '@'; }

    // Distributes the |message| as sent by |player| to the recipients of this channel. Bail out
    // early if the |player| has been isolated by an administrator.
    distribute(player, message, nuwani) {
        if (player.syncedData.isIsolated()) {
            player.sendMessage(Message.COMMUNICATION_ADMIN_SENT);
            return;
        }

        const prefix = this.getPrefixForPlayer(player);
        const formattedMessage =
            Message.format(Message.COMMUNICATION_ADMIN_MESSAGE, prefix, player.name, player.id,
                           message);

        let onlineAdministrators = 0;
        for (const recipient of server.playerManager) {
            if (!recipient.isAdministrator())
                continue;  // only administrators may receive these messages

            recipient.sendMessage(formattedMessage);
            
            if (!recipient.isUndercover())
                onlineAdministrators++;
        }

        nuwani.echo('chat-admin', player.id, player.name, message);
        if (!onlineAdministrators)
            nuwani.echo('chat-admin-offline', player.name, player.id, message);

        if (!player.isAdministrator())
            player.sendMessage(Message.COMMUNICATION_ADMIN_SENT);
    }

    // Returns the prefix to use for the given |player|. This depends on their level, as well as
    // a series of specializations we've issued to particular players.
    getPrefixForPlayer(player) {
        const personalizedPrefix = kPersonalizedPrefixes.get(player.account.userId);
        if (personalizedPrefix)
            return personalizedPrefix;
        
        if (player.isManagement())
            return 'Manager';

        if (player.isAdministrator())
            return 'Admin';
        
        return 'Message from';  // regular players        
    }
}
