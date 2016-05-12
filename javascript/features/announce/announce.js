// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const AnnounceManager = require('features/announce/announce_manager.js');
const Feature = require('components/feature_manager/feature.js');

// The announce feature offers a set of APIs that can be used to announce events to IRC, players
// and administrators. This is solely meant for internal usage, and does not offer commands.
class Announce extends Feature {
    constructor() {
        super();

        this.manager_ = new AnnounceManager();
    }

    // ---------------------------------------------------------------------------------------------
    // Public API of the announce feature.
    // ---------------------------------------------------------------------------------------------

    // Announces |message| to all in-game players. This will automatically generate an IRC message
    // with the "announce" tag. The |args| will only be used if |message| is a Message object.
    announceToPlayers(message, ...args) {
        this.manager_.announceToPlayers(message, ...args);
    }

    // Announces |message| to all in-game administrators. This will automatically generate an IRC
    // message with the "admin" tag. The |args| will only be used if |message| is a Message object.
    announceToAdministrators(message, ...args) {
        this.manager_.announceToAdministrators(message, ...args);
    }

    // Announces |tag| with the |...parameters| to people watching on IRC.
    announceToIRC(tag, ...parameters) {
        this.manager_.announceToIRC(tag, ...parameters);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.manager.dispose();
    }
}

exports = Announce;
