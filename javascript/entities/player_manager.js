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
            'playerlevelchange', PlayerManager.prototype.onPlayerLevelChange.bind(this));
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

    // Finds one or more players that match the constraints given in the named parameters. Returns
    // an array of players by default, or a Player instance when |returnPlayer| is set to true. In
    // both cases NULL will be returned when no player has been selected.
    find({ nameOrId = null, returnPlayer = false } = {}) {
        // TODO(Russell): Implement this method properly.

        let player = this.getById(nameOrId);
        if (player)
            return player;

        return this.getByName(nameOrId);
    }

    // Executes the |callback| once for each player connected to the server. The first argument to
    // the |callback| will be the Player object, the second the player's ID.
    forEach(callback, thisArg = null) {
        Object.keys(this.players_).forEach(playerId =>
            callback.call(thisArg, this.players_[playerId], parseInt(playerId, 10)));
    }

    // Observes players connecting and disconnecting from the server. The |observer| will receive
    // calls to the following methods: onPlayerConnect, onPlayerDisconnect.
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

        const player = this.createPlayer(playerId, event);

        this.players_[playerId] = player;
        this.playersByName_[player.name] = player;

        this.count_++;
        this.highestId_ = Math.max(this.highestId_, playerId);

        this.notifyObservers('onPlayerConnect', player);
    }

    // Called when a player's level on the server changes, for example because they log in to their
    // account, they get temporary rights or take their own rights away.
    onPlayerLevelChange(event) {
        const playerId = event.playerid;

        if (!this.players_.hasOwnProperty(playerId))
            return;  // the event has been received for an invalid player.

        const player = this.players_[playerId];

        switch (event.newlevel) {
            case 3:  // Management
                player.level = Player.LEVEL_MANAGEMENT;
                break;
            case 2:  // Administrator
                player.level = Player.LEVEL_ADMINISTRATOR;
                break;
            default:
                player.level = Player.LEVEL_PLAYER;
                break;
        }

        this.notifyObservers('onPlayerLevelChange', player);
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

        player.notifyDisconnected();

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

        this.notifyObservers('onPlayerDisconnect', player, reason);
    }

    // Factory method for creating a Player instance for the player with Id |playerId|. May be
    // overridden for tests in order to verify the functionality of this class.
    createPlayer(playerId, event) {
        return new Player(playerId);
    }

    // Notifies observers about the |eventName|, passing |...args| as the argument to the method
    // when it exists. The call will be bound to the observer's instance.
    notifyObservers(eventName, ...args) {
        for (let observer of this.observers_) {
            if (observer.__proto__.hasOwnProperty(eventName))
                observer.__proto__[eventName].call(observer, ...args);
            else if (observer.hasOwnProperty(eventName))
                observer[eventName].call(observer, ...args);
        }
    }

    // Releases all references and state held by the player manager.
    dispose() {
        this.callbacks_.dispose();
        this.callbacks_ = null;

        this.observers_ = null;
    }
}

exports = PlayerManager;
