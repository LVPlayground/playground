// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { AnnounceManager } from 'features/announce/announce_manager.js';
import { AnnounceNatives } from 'features/announce/announce_natives.js';
import { Feature } from 'components/feature_manager/feature.js';
import { NewsManager } from 'features/announce/news_manager.js';

import { format } from 'base/format.js';

import { kAnnouncementCategories } from 'features/announce/announce_categories.js';

// The announce feature offers a set of APIs that can be used to announce events to IRC, players
// and administrators. This is solely meant for internal usage, and does not offer commands.
export default class Announce extends Feature {
    manager_ = null;
    natives_ = null;
    newsManager_ = null;
    nuwani_ = null;

    constructor() {
        super();

        // The ability to share announcements with players is deemed a low-level capability.
        this.markLowLevel();

        // Depend on the Nuwani feature to be able to announce messages to IRC. Features wishing to
        // send their own IRC messages should depend on Nuwani individually.
        this.nuwani_ = this.defineDependency('nuwani');

        // Depend on the Settings module because various parts of the news messaging behaviour are
        // configurable by Management members, using the "/lvp settings" argument.
        const settings = this.defineDependency('settings');

        // Provides native functions for the announce feature, which have access to a selected sub-
        // set of the public API exposed by this feature.
        this.natives_ = new AnnounceNatives(this);

        // Manages the news medium for making announcements to players. Optionally displayed at the
        // bottom of their screens, it's convenient for less important messaging.
        this.newsManager_ = new NewsManager(settings);

        this.manager_ = new AnnounceManager(this.nuwani_);
    }

    // ---------------------------------------------------------------------------------------------
    // Public API: High-level announcements
    // ---------------------------------------------------------------------------------------------

    // Announces that a game has started with the given |name|, which others can join by executing
    // the given |command|. Will be announced to all players, both in and out-of-game.
    announceGame(player, name, command, price) {
        this.manager_.publishAnnouncement({
            message: format(!price ? Message.ANNOUNCE_GAME_REGISTRATION_FREE
                                   : Message.ANNOUNCE_GAME_REGISTRATION, name, command, price),

            // Exclude the |player| from the announcement, they'll get targetted messaging.
            predicate: recipient => {
                return recipient !== player;
            },
        });
    }

    // Announces that the |player| has signed up for a game with the given |name|, which others can
    // join with the given |command|. Will be announced to all players, but subtly.
    announceGameParticipation(player, name, command) {
        this.broadcastNews(
            Message.ANNOUNCE_GAME_PARTICIPATION_NEWS, player.name, name, command);

        this.nuwani_().echo('notice-minigame', player.name, player.id, name);
    }

    // ---------------------------------------------------------------------------------------------
    // Public API: Low-level announcements
    // ---------------------------------------------------------------------------------------------

    // Issues an announcement of the given |category| to all players who should receive it. The
    // |category| must be listed in `announce_categories.js`, which defines the default set of
    // recipients. The |message| will be formatted according to the |params| when available.
    broadcast(category, message, ...params) {
        if (!kAnnouncementCategories.has(category))
            throw new Error(`Invalid broadcast category given: ${category}.`);

        this.manager_.broadcast(kAnnouncementCategories.get(category), message, ...params);
    }

    // Announces the given |message| to all players who see news messages. The |message| will be
    // formatted according to the |params| when given. Must follow game text styling.
    broadcastNews(message, ...params) {
        this.newsManager_.broadcastNews(message, ...params);
    }

    // ---------------------------------------------------------------------------------------------
    // TODO: Clean up these things
    // ---------------------------------------------------------------------------------------------

    // DO NOT ADD NEW USAGES OF THIS FUNCTION.
    //
    // Instead, look into using the broadcast() method instead, which everything is expected to
    // update to. This takes a mandatory category that will enable all sorts of admin messages to
    // be configurable by administrators (and players!), as they see fit.
    announceToAdministrators(message, ...params) {
        this.manager_.announceToAdministrators(message, ...params);
    }

    // Announces |message| to all in-game players. This will automatically generate an IRC message
    // with the "announce" tag. The |args| will only be used if |message| is a Message object.
    announceToPlayers(message, ...args) {
        this.manager_.announceToPlayers(message, ...args);
    }

    // Announces that a |player| did a report of |reportedPlayer| because of |reason| to all in-game
    // administrators. This will automatically generate an IRC message with the "report" tag.
    announceReportToAdministrators(player, reportedPlayer, reason) {
        this.manager_.announceReportToAdministrators(player, reportedPlayer, reason);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.nuwani_ = null;

        this.newsManager_.dispose();
        this.newsManager_ = null;

        this.natives_.dispose();
        this.natives_ = null;
    }
}
