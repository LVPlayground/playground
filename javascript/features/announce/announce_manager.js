// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { format } from 'base/format.js';

// Implementation of the functionality of the Announce feature. This is where input will be verified
// and the messages will be dispatched to the appropriate audience.
export class AnnounceManager {
    nuwani_ = null;

    constructor(nuwani) {
        this.nuwani_ = nuwani;
    }

    // ---------------------------------------------------------------------------------------------

    // Issues an announcement of the given |category| to all players who should receive it. The
    // |message| and |params| will be substituted individually for each of the recipients.
    broadcast(category, message, ...params) {
        for (const player of server.playerManager) {
            if (player.isNonPlayerCharacter())
                continue;  // never send messages to non-player characters

            if (player.level < category.level)
                continue;  // the player is not eligible to receive this message

            // TODO: Check if the |player| has toggled visibility of the |message| themselves. Until
            // we implement this, ignore the |defaultEnabled| property on |category| too.

            if (category.prefix) {
                const prefix = category.prefix(null);
                const formattedMessage = typeof message === 'string' ? message
                                                                     : message(null, ...params);

                player.sendMessage(`${prefix}${formattedMessage}`);
            } else {
                player.sendMessage(message, ...params);
            }
        }

        // Also broadcast the |message| to people watching through Nuwani if it's intended for
        // administrators and/or above, as an admin notice. We format the message in English.
        if (category.level > Player.LEVEL_PLAYER) {
            const formattedMessage = message(null, ...params);
            const normalizedMessage = formattedMessage.replace(/\{([a-f0-9]{6})\}/gi, '');

            this.nuwani_().echo('notice-admin', normalizedMessage);
        }

        // If the |category| has been explicitly marked as making an announcement to Nuwani, forward
        // the message in English as well, but as a regular announcement.
        else if (category.nuwani) {
            const formattedMessage = message(null, ...params);
            const normalizedMessage = formattedMessage.replace(/\{([a-f0-9]{6})\}/gi, '');

            this.nuwani_().echo('notice-announce', normalizedMessage);
        }
    }

    // ---------------------------------------------------------------------------------------------
    // TODO: Clean up the rest
    // ---------------------------------------------------------------------------------------------

    // Announces the given |message| to all players, optionally filtered by the given |predicate|.
    publishAnnouncement({ message, predicate = null } = {}) {
        for (const player of server.playerManager) {
            if (player.isNonPlayerCharacter())
                continue;  // never send messages to non-player characters

            if (predicate && !predicate(player))
                continue;  // the |predicate| decided to not distribute this message

            player.sendMessage(message);
        }
    }

    // Announces |message| to all in-game administrators. Optionally |args| may be passed if
    // |message| is an instance of Message, which is common infrastructure for user-visible text.
    announceToAdministrators(message, ...args) {
        if (typeof message === 'function')
            message = message(null, ...args);
        else if (args.length)
            message = format(message, ...args);

        const formattedMessage = format(Message.ANNOUNCE_ADMINISTRATORS, message);

        server.playerManager.forEach(player => {
            if (!player.isAdministrator())
                return;

            player.sendMessage(formattedMessage);
        });

        this.nuwani_().echo('notice-admin', message.replace(/\{([a-f0-9]{6})\}/gi, ''));
    }

    // Announces that a |player| did a report of |reportedPlayer| because of |reason| to all in-game
    // administrators. It uses the ReportTag for the IRC-message.
    announceReportToAdministrators(player, reportedPlayer, reason) {
        const formattedMessage = format(
            Message.ANNOUNCE_REPORT, player.name, player.id, reportedPlayer.name, 
            reportedPlayer.id, reason);

        server.playerManager.forEach(player => {
            if (!player.isAdministrator())
                return;

            player.sendMessage(formattedMessage);
        });

        this.nuwani_().echo('notice-report', player.name, player.id, reportedPlayer.name,
                            reportedPlayer.id, reason);
    }
}
