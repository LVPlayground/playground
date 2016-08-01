// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const SessionId = require('features/logger/session_id.js');

// The entity logger is responsible for creating log entities for the observable methods on the
// entity managers, for example the PlayerManager.
class EntityLogger {
    constructor(writer, sessions) {
        this.writer_ = writer;
        this.sessions_ = sessions;

        server.playerManager.addObserver(this);
    }

    // Records that |player| has connected to the server. This generates a session Id for the player
    // that can be used to track events for a given session.
    onPlayerConnect(player) {
        this.sessions_.set(player, SessionId.generateForPlayer(player));

        this.writer_.writeEvent('playerconnect', {
            session: this.sessions_.get(player),
            nickname: player.name,
            ip: player.ip,

            // Specific to this event.
            gpci: player.gpci
        });
    }

    // Records that |player| has disconnected from the server. This removes the session Id assigned
    // to the player from the set of active sessions.
    onPlayerDisconnect(player, reason) {
        this.writer_.writeEvent('playerdisconnect', {
            session: this.sessions_.get(player),
            nickname: player.name,
            ip: player.ip,

            // Specific to this event.
            gpci: player.gpci
        });

        this.sessions_.delete(player);
    }

    // Records that |player| has logged in to their account.
    onPlayerLogin(player) {
        this.writer_.writeEvent('playerlogin', {
            session: this.sessions_.get(player),
            nickname: player.name,
            ip: player.ip,

            // Specific to this event.
            gpci: player.gpci,
            user_id: player.userId(),
            level: player.level
        });
    }

    dispose() {
        server.playerManager.removeObserver(this);
    }
}

exports = EntityLogger;
