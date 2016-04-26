// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ScopedCallbacks = require('base/scoped_callbacks.js');

// The player manager keeps track of all players connected to Las Venturas Playground. Features may
// choose to observe the manager in order to receive notifications when someone connects or
// disconnects from the server. Non-player characters are treated identical to players.
class PlayerManager {
    constructor() {
        this.players_ = {};
        this.playersByName_ = {};

        this.observers_ = new Set();

        this.callbacks_ = new ScopedCallbacks();
        this.callbacks_.addEventListener(
            'playerconnect', PlayerManager.prototype.onPlayerConnect.bind(this));
        this.callbacks_.addEventListener(
            'playerdisconnect', PlayerManager.prototype.onPlayerDisconnect.bind(this));
    }

    // Observes players connecting and disconnecting from the server. The |observer| must have two
    // methods on its prototype: onPlayerConnect and onPlayerDisconnect.
    addObserver(observer) {
        this.observers_.add(observer);
    }

    // Removes |observer| from the set of objects that will be informed about players connecting
    // and disconnecting from the server.
    removeObserver(observer) {
        this.observers_.delete(observer);
    }

    // Called when a player has connected to Las Venturas Playground. The |event| may potentially
    // contain untrusted or incorrect data that has to be verified.
    onPlayerConnect(event) {
        const playerId = event.playerid;

        if (this.players_.hasOwnProperty(playerId)) {
            console.log('[PlayerManager] Warning: A player with ID ' + playerId + ' is already ' +
                        'connected to the server.');
            return;
        }

        const player = new Player(playerId);

        this.players_[playerId] = player;
        this.playersByName_[player.name] = player;

        this.notifyPlayerConnected(player);
    }

    // Called when a player has disconnected from Las Venturas Playground. The |event| may contain
    // untrusted or incorrect data that has to be verified.
    onPlayerDisconnect(event) {
        const playerId = event.playerid;
        const reason = event.reason;

        if (!this.players_.hasOwnProperty(playerId)) {
            console.log('[PlayerManager] Warning: A player with ID ' + playerId + ' is not ' +
                        'connected to the server.');
            return;
        }

        const player = this.players_[playerId];

        delete this.players_[playerId];
        delete this.playersByName_[player.name];

        this.notifyPlayerDisconnected(player, reason);
    }

    // Notifies observers that the |player| has connected to Las Venturas Playground.
    notifyPlayerConnected(player) {
        for (let observer of this.observers_)
            observer.onPlayerConnect(player);
    }

    // Notifies observers that the |player| has disconnected from Las Venturas Playground due to
    // |reason|, which must be one of the Player.DISCONNECT_REASON_* values.
    notifyPlayerDisconnected(player, reason) {
        for (let observer of this.observers_)
            observer.onPlayerDisconnect(player, reason);
    }

    // Releases all references and state held by the player manager.
    dispose() {
        this.callbacks_.dispose();
        this.callbacks_ = null;

        this.observers_ = null;
    }
}

exports = PlayerManager;
