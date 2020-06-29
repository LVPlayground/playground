// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { ScopedCallbacks } from 'base/scoped_callbacks.js';

// Converts a Pawn level to a JavaScript level. These are different, because Pawn still has some
// knowledge of Moderators which we've deprecated years ago.
function toJavaScriptLevel(level) {
    if (level === 3)
        return Player.LEVEL_MANAGEMENT;
    else if (level === 2)
        return Player.LEVEL_ADMINISTRATOR;

    return Player.LEVEL_PLAYER;
}

// The player manager keeps track of all players connected to Las Venturas Playground. Features may
// choose to observe the manager in order to receive notifications when someone connects or
// disconnects from the server. Non-player characters are treated identical to players.
export class PlayerManager {
    constructor(playerConstructor = Player) {
        this.playerConstructor_ = playerConstructor;
        this.players_ = new Map();

        this.selectingPlayers_ = new WeakSet();

        this.observers_ = new Set();

        this.callbacks_ = new ScopedCallbacks();
        this.callbacks_.addEventListener(
            'playerconnect', PlayerManager.prototype.onPlayerConnect.bind(this));
        this.callbacks_.addEventListener(
            'playerspawn', PlayerManager.prototype.onPlayerSpawn.bind(this));
        this.callbacks_.addEventListener(
            'playerstatechange', PlayerManager.prototype.onPlayerStateChange.bind(this));
        this.callbacks_.addEventListener(
            'playerdisconnect', PlayerManager.prototype.onPlayerDisconnect.bind(this));
        
        // Events custom to Las Venturas Playground
        this.callbacks_.addEventListener(
            'playeractivitychange', PlayerManager.prototype.onPlayerActivityChange.bind(this));
        this.callbacks_.addEventListener(
            'messagelevelchange', PlayerManager.prototype.onPlayerMessageLevelChange.bind(this));

        // Implementation of the UpdatePlayerSyncedData() Pawn native.
        provideNative('UpdatePlayerSyncedData', 'iiifs',
                      PlayerManager.prototype.updatePlayerSyncedData.bind(this))
    }

    // Gets the number of players currently connected to the server.
    get count() { return this.players_.size; }

    // Returns the player whose Id is |playerId|, or NULL when they are not connected.
    getById(playerId) {
        if (!this.players_.has(playerId))
            return null;

        return this.players_.get(playerId);
    }

    // Returns the player whose name is |name|, optionally |fuzzy| when set. NULL will be returned
    // when there is no player with the |name|, or when a |fuzzy| match is requested and multiple
    // players match the |name|. (In which case you'd want to use findPlayers().)
    getByName(name, fuzzy = false) {
        if (fuzzy) {
            let matches = [];

            const lowerCaseName = name.toLowerCase();
            for (const player of this.players_.values()) {
                if (player.name.toLowerCase().includes(lowerCaseName))
                    matches.push(player);
            }

            if (matches.length == 1)
                return matches[0];

            return null;
        }

        for (const player of this.players_.values()) {
            if (player.name === name)
                return player;
        }

        return null;
    }

    // Finds one or more players that match the constraints given in the named parameters. Returns
    // an array of players by default, or a Player instance when |returnPlayer| is set to true. In
    // both cases NULL will be returned when no player has been selected.
    find({ nameOrId = null, returnPlayer = false } = {}) {
        // TODO(Russell): Implement this method properly.

        if (/^\d+$/.test(nameOrId)) {
            const playerId = parseInt(nameOrId, 10 /* base */);
        
            if (!Number.isNaN(playerId) && this.players_.has(playerId))
                return this.players_.get(playerId);
        }

        return this.getByName(nameOrId, true /* fuzzy */);
    }

    // Executes the |callback| once for each player connected to the server. The first argument to
    // the |callback| will be the Player object, the second the player's ID.
    forEach(callback, thisArg = null) {
        for (const player of this.players_.values())
            callback.call(thisArg, player, player.id);
    }

    // Observes players connecting and disconnecting from the server. The |observer| will receive
    // calls to the following methods: onPlayerConnect, onPlayerDisconnect. When the |replayHistory|
    // option has been set, events for existing players will be replayed to the observer.
    addObserver(observer, replayHistory = false) {
        if (this.observers_.has(observer))
            return;

        this.observers_.add(observer);

        if (!replayHistory)
            return;

        for (const player of this.players_.values()) {
            if ('onPlayerConnect' in observer)
                observer.onPlayerConnect(player);

            if ('onPlayerLogin' in observer && player.account.isRegistered())
                observer.onPlayerLogin(player, {});
            else if ('onPlayerGuestSession' in observer && !player.account.isRegistered())
                observer.onPlayerGuestSession(player);
        }
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

        if (this.players_.has(playerId)) {
            console.log('[PlayerManager] Warning: A player with Id ' + playerId + ' is already ' +
                        'connected to the server.');
            return;
        }

        // Pass the |event| as it may contain additional meta-data when used by tests.
        const player = new this.playerConstructor_(playerId, this);
        player.initialize(event);

        // Associate the |player| instance with the |playerId|.
        this.players_.set(playerId, player);

        // Notify the observers of the |player|'s connection.
        this.notifyObservers('onPlayerConnect', player);
    }

    // Called when a player's activity has changed in Pawn, which we have to align in our state.
    onPlayerActivityChange(event) {
        const player = this.players_.get(event.playerid);
        if (!player)
            return;  // the event has been received for an invalid player
        
        player.activityInternal = event.activity;
    }

    // Called when a player's message level has changed in the Pawn world.
    onPlayerMessageLevelChange(event) {
        const player = this.players_.get(event.playerid);
        if (!player)
            return;  // the event has been received for an invalid player
        
        player.messageLevel = event.messagelevel;
    }

    // Called when the |player|'s nickname has changed into something else. Optionally, if the
    // |resync| flag has been set, the |player| object will update its state first.
    onPlayerNameChange(player, update = false) {
        if (update)
            player.updateName();
        
        this.notifyObservers('onPlayerNameChange', player);
    }

    // Called when the |player| does not have an account, and is starting to play after all.
    onPlayerGuestSession(player) {
        this.notifyObservers('onPlayerGuestSession', player);
    }

    // Called when a player logs in to their account. This marks availability of their user data
    // and the fact that their identity has been verified.
    //
    // This method is called by the Account feature when loaded. Observer delivery is delayed on the
    // player's account data being loaded from the database.
    onPlayerLogin(event) {
        const player = this.players_.get(event.playerid);
        if (!player)
            return;  // the event has been received for an invalid player

        if (!server.isTest())
            player.level = player.account.level;

        player.userId = event.userid;
        player.setVip(!!event.vip);
        player.setUndercover(!!event.undercover);

        this.notifyObservers('onPlayerLogin', player, event);
    }

    // Called when a player has selected an object.
    onPlayerSelectObject(event) {
        const player = this.players_.get(event.playerid);
        if (!player)
            return;  // invalid player, or they're not selecting in JavaScript

        this.selectingPlayers_.delete(player);

        const object = server.objectManager.getById(event.objectid);
        if (!object) {
            player.onObjectSelected(null);
            return;
        }

        player.onObjectSelected(object);
    }

    // Called when a player spawns into the world, either because they've just connected, died or
    // were killed by another player.
    onPlayerSpawn(event) {
        const player = this.players_.get(event.playerid);
        if (!player)
            return;  // invalid |event| as the player does not exist
        
        this.notifyObservers('onPlayerSpawn', player);
    }

    // Called when a player's state changes. Handles players entering and leaving vehicles, and
    // synchronizing this information with both the Player and Vehicle instances.
    onPlayerStateChange(event) {
        const player = this.players_.get(event.playerid);
        if (!player)
            return;  // the player isn't valid

        if ([Player.kStateVehicleDriver, Player.kStateVehiclePassenger].includes(event.oldstate)) {
            const vehicle = player.vehicle;
            if (!vehicle)
                return;  // the vehicle isn't managed by JavaScript

            this.notifyObservers('onPlayerLeaveVehicle', player, vehicle);

            vehicle.onPlayerLeaveVehicle(player);

            player.vehicle = null;
            player.vehicleSeat = null;
        }

        if ([Player.kStateVehicleDriver, Player.kStateVehiclePassenger].includes(event.newstate)) {
            const vehicleId =
                server.isTest() ? player.vehicle?.id
                                : pawnInvoke('GetPlayerVehicleID', 'i', player.id);

            const vehicleSeat =
                server.isTest() ? player.vehicleSeat
                                : pawnInvoke('GetPlayerVehicleSeat', 'i', player.id);

            const vehicle = server.vehicleManager.getById(vehicleId);
            if (!vehicle)
                return;  // the vehicle isn't managed by JavaScript

            player.vehicle = vehicle;
            player.vehicleSeat = vehicleSeat;

            vehicle.onPlayerEnterVehicle(player);

            this.notifyObservers('onPlayerEnterVehicle', player, vehicle);
        }
    }

    // Called when a player has disconnected from Las Venturas Playground. The |event| may contain
    // untrusted or incorrect data that has to be verified.
    onPlayerDisconnect(event) {
        const player = this.players_.get(event.playerid);
        if (!player)
            return;  // the event has been received for an invalid player

        const reason = event.reason;

        // Notify the |player| instance of the fact that the associated player is disconnecting.
        player.notifyDisconnecting();

        // Remove the player from their vehicle if they're currently in one.
        if (player.vehicle !== null) {
            this.notifyObservers('onPlayerLeaveVehicle', player, player.vehicle);

            player.vehicle.onPlayerLeaveVehicle(player);

            player.vehicle = null;
            player.vehicleSeat = null;
        }

        // Remove knowledge of the |player| from the player manager.
        this.players_.delete(event.playerid);

        // Tell the object manager, in case the player was editing an object.
        server.objectManager.onPlayerDisconnect(player);

        // If the player was selecting an object, pretend like they've cancelled this.
        if (this.selectingPlayers_.has(player)) {
            this.selectingPlayers_.delete(player);

            player.onObjectSelected(null);
        }

        // Notify observers of the player manager of their disconnecting.
        this.notifyObservers('onPlayerDisconnect', player, reason);

        // And finally mark the player as having disconnected.
        player.notifyDisconnected();
    }

    // Called when a value of synchronized data associated with a player has changed.
    updatePlayerSyncedData(playerId, property, intValue, floatValue, stringValue) {
        const player = this.players_.get(playerId);
        if (!player)
            return;  // the event has been received for an invalid player

        player.syncedData.apply(property, intValue, floatValue, stringValue);
    }

    // Notifies observers about the |eventName|, passing |...args| as the argument to the method
    // when it exists. The call will be bound to the observer's instance.
    notifyObservers(eventName, ...args) {
        for (const observer of this.observers_) {
            let prototype = Object.getPrototypeOf(observer);

            // Iterate up the class hierarchy to find a parent having |eventName|.
            while (prototype && !prototype.hasOwnProperty(eventName))
                prototype = Object.getPrototypeOf(prototype);

            // If such a prototype has been found, call the |eventName| on it.
            if (!prototype)
                continue;
            
            try {
                prototype[eventName].call(observer, ...args);
            } catch (exception) {
                console.log(exception);
            }
        }
    }

    // Returns an iterator that can be used to iterate over the connected players.
    [Symbol.iterator]() { return this.players_.values(); }

    // Called when the |player| is in the select object flow. This enables us to make sure that the
    // promise watching over the flow will be resolved even when they disconnect.
    didRequestSelectObject(player) {
        this.selectingPlayers_.add(player);
    }

    // Releases all references and state held by the player manager.
    dispose() {
        provideNative('UpdatePlayerSyncedData', 'iiifs', () => 1);

        this.callbacks_.dispose();
        this.callbacks_ = null;

        this.observers_ = null;
        this.players_ = null;
    }
}
