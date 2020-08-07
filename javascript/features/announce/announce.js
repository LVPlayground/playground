// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { AnnounceManager } from 'features/announce/announce_manager.js';
import { Feature } from 'components/feature_manager/feature.js';
import { NewsManager } from 'features/announce/news_manager.js';

// The announce feature offers a set of APIs that can be used to announce events to IRC, players
// and administrators. This is solely meant for internal usage, and does not offer commands.
export default class Announce extends Feature {
    constructor() {
        super();

        // The ability to share announcements with players is deemed a low-level capability.
        this.markLowLevel();

        // Depend on the Nuwani feature to be able to announce messages to IRC. Features wishing to
        // send their own IRC messages should depend on Nuwani individually.
        const nuwani = this.defineDependency('nuwani');

        // Depend on the Settings module because various parts of the news messaging behaviour are
        // configurable by Management members, using the "/lvp settings" argument.
        const settings = this.defineDependency('settings');

        // Manages the news medium for making announcements to players. Optionally displayed at the
        // bottom of their screens, it's convenient for less important messaging.
        this.newsManager_ = new NewsManager(settings);

        this.manager_ = new AnnounceManager(nuwani);
    }

    // ---------------------------------------------------------------------------------------------
    // Public API of the announce feature.
    // ---------------------------------------------------------------------------------------------

    // Announces that the |name| has started by |player|. Players can join by typing |command|, and
    // will have to pay |price| in order to participate in the minigame.
    announceMinigame(player, name, command, price = 0) {
        this.manager_.announceMinigame(player, name, command, price);
    }

    // Announces that |player| has joined the minigame named |name|. Other players can type the
    // |command| themselves to participate in the minigame as well.
    announceMinigameParticipation(player, name, command) {
        this.manager_.announceMinigameParticipation(player, name, command);
    }

    // Announces the given |message| to all players who see news messages. The |message| will be
    // formatted according to the |params| when given. Must follow game text styling.
    announceNewsMessage(message, ...params) {
        this.newsManager_.announceNewsMessage(message, ...params);
    }

    // Announces |message| to all in-game players. This will automatically generate an IRC message
    // with the "announce" tag. The |args| will only be used if |message| is a Message object.
    announceToPlayers(message, ...args) {
        this.manager_.announceToPlayers(message, ...args);
    }

    // Announces |message| to all in-game administrators that have uncategorized messages enabled. 
    // This will automatically generate an IRC message with the "admin" tag if uncategorized 
    // announcements are enabled in the settings. The |args| will only be used if |message| is a 
    // Message object.
    announceToAdministrators(message, ...args) {
        this.manager_.announceToAdministrators(message, ...args);
    }

    // Announces |message| to all in-game administrators who have the |announceSubcategory| and 
    // |subCommand| enabled. This will automatically generate an IRC message with the "admin" tag 
    // if uncategorized announcements are enabled in the settings. The |args| will only be used if 
    // |message| is a Message object.
    announceToAdministratorsWithFilter(message, announceSubcategory, subCommand, ...args) {
        this.manager_.announceToAdministratorsWithFilter(message, announceSubcategory, subCommand, 
            ...args);
    }

    // Announces that a |player| did a report of |reportedPlayer| because of |reason| to all in-game
    // administrators. This will automatically generate an IRC message with the "report" tag.
    announceReportToAdministrators(player, reportedPlayer, reason) {
        this.manager_.announceReportToAdministrators(player, reportedPlayer, reason);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.newsManager_.dispose();
        this.newsManager_ = null;
    }
}
