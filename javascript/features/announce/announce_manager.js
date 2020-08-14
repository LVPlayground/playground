// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { PlayerSetting } from 'entities/player_setting.js';

import { format } from 'base/format.js';

// Implementation of the functionality of the Announce feature. This is where input will be verified
// and the messages will be dispatched to the appropriate audience.
export class AnnounceManager {
    nuwani_ = null;

    constructor(nuwani) {
        this.nuwani_ = nuwani;
    }

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

    // Announces that the |name| has started. Players can join by typing |command|.
    announceMinigame(player, name, command) {
        const formattedMessage = format(Message.ANNOUNCE_MINIGAME, name, command);

        server.playerManager.forEach(onlinePlayer =>
            onlinePlayer.sendMessage(formattedMessage));
    }

    // Announces that |player| has joined the minigame named |name|. Other players can type the
    // |command| themselves to participate in the minigame as well.
    announceMinigameParticipation(player, name, command) {
        const formattedMessage =
            format(Message.ANNOUNCE_NEWS_MINIGAME_JOINED, player.name, name, command);

        // TODO(Russell): Validate that |formattedMessage| is safe for game text usage.

        // Announce it asynchronously when not running a test to avoid reentrancy problems.
        Promise.resolve().then(() => pawnInvoke('OnDisplayNewsMessage', 's', formattedMessage));

        this.nuwani_().echo('notice-minigame', player.name, player.id, name);
    }

    // Announces |message| to all in-game players. Optionally |args| may be passed if the |message|
    // is an instance of the Message class, which is common infrastructure for user-visible text.
    announceToPlayers(message, ...args) {
        if (args.length)
            message = format(message, ...args);

        const formattedMessage = format(Message.ANNOUNCE_ALL, message);

        server.playerManager.forEach(player =>
            player.sendMessage(formattedMessage));

        this.nuwani_().echo('notice-announce', message);
    }

    // Announces |message| to all in-game administrators. Optionally |args| may be passed if
    // |message| is an instance of Message, which is common infrastructure for user-visible text.
    announceToAdministrators(message, ...args) {
        this.announceToAdministratorsWithFilter(message, PlayerSetting.ANNOUNCEMENT.UNCATEGORIZED, 
            PlayerSetting.SUBCOMMAND.GENERAL, ...args);
    }

    // Announces |message| to the administrators that have the announcements for |announceSubcategory| 
    // and |subCommand| enabled. Optionally |args| may be passed if |message| is an instance of Message, 
    // which is common infrastructure for user-visible text.
    announceToAdministratorsWithFilter(message, announceSubcategory, subCommand, ...args) {
        if (typeof message === 'function')
            message = message(null, ...args);
        else if (args.length)
            message = format(message, ...args);

        const formattedMessage = format(Message.ANNOUNCE_ADMINISTRATORS, message);

        server.playerManager.forEach(player => {
            if (!player.isAdministrator())
                return;
/**
            var item = player.settings.getValue(generalIdentifier);
            var subItem = player.settings.getValue(specificIdentifier);

            if (item === false || subItem === false) {
                return;
            }
*/
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
