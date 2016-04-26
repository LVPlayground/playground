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

        this.count_ = 0;
        this.highestId_ = 0;

        this.observers_ = new Set();

        this.callbacks_ = new ScopedCallbacks();
        this.callbacks_.addEventListener(
            'playerconnect', PlayerManager.prototype.onPlayerConnect.bind(this));
        this.callbacks_.addEventListener(
            'playerdisconnect', PlayerManager.prototype.onPlayerDisconnect.bind(this));
    }

    // Gets the number of players currently connected to the server.
    get count() { return this.count_; }

    // Gets the highest ID assigned to a player connected to the server.
    get highestId() { return this.highestId_; }

    // Returns the player whose ID is |playerId|, or NULL when they are not connected.
    getById(playerId) {
        if (this.players_.hasOwnProperty(playerId))
            return this.players_[playerId];

        return null;
    }

    // Returns the player whose name is |name|, optionally |fuzzy| when set. NULL will be returned
    // when there is no player with the |name|, or when a |fuzzy| match is requested and multiple
    // players match the |name|. (In which case you'd want to use findPlayers().)
    getByName(name, fuzzy = false) {
        if (fuzzy) {
            let matches = [];

            const lowerCaseName = name.toLowerCase();
            Object.values(this.players_).forEach(player => {
                if (player.name.toLowerCase().includes(lowerCaseName))
                    matches.push(player);
            });

            if (matches.length == 1)
                return matches[0];

            return null;
        }

        if (this.playersByName_.hasOwnProperty(name))
            return this.playersByName_[name];

        return null;
    }

    // Executes the |callback| once for each player connected to the server. The first argument to
    // the |callback| will be the Player object, the second the player's ID.
    forEach(callback, thisArg = null) {
        Object.keys(this.players_).forEach(playerId =>
            callback.call(thisArg, this.players_[playerId], parseInt(playerId, 10)));
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

        const player = this.createPlayer(playerId);

        this.players_[playerId] = player;
        this.playersByName_[player.name] = player;

        this.count_++;
        this.highestId_ = Math.max(this.highestId_, playerId);

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

        this.count_--;

        if (playerId == this.highestId_) {
            while (this.highestId_ > 0) {
                if (this.players_.hasOwnProperty(this.highestId_))
                    break;

                this.highestId_--;
            }
        }

        this.notifyPlayerDisconnected(player, reason);
    }

    // Factory method for creating a Player instance for the player with Id |playerId|. May be
    // overridden for tests in order to verify the functionality of this class.
    createPlayer(playerId) {
        return new Player(playerId);
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
