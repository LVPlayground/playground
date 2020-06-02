// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Pickup } from 'entities/pickup.js';

// Number of milliseconds after which it should be confirmed whether the player is still standing
// in the given pickup. This works around an issue where SA-MP fires the event too frequently.
const PickupPositionValidationFrequency = 1000;

// The maximum distance, squared, that a player may be away from the pickup's position in order to
// still be considered to be standing on it.
export const PickupPositionValidDistanceSq = 2 * 2;

// The pickup manager maintains the list of pickups created for Las Venturas Playground, and is in
// charge of delegating events related to those pickups.
export class PickupManager {
    pickupConstructor_ = null;
    pickupRespawning_ = null;
    pickups_ = null;

    observers_ = null;

    currentPickupForPlayer_ = null;

    constructor(pickupConstructor = Pickup) {
        this.pickupConstructor_ = pickupConstructor;
        this.pickupRespawning_ = new Set();
        this.pickups_ = new Map();

        this.currentPickupForPlayer_ = new WeakMap();
        this.observers_ = new Set();
    }

    get count() { return this.pickups_.size; }

    // ---------------------------------------------------------------------------------------------

    // Creates a new pickup with the given options. The |modelId| and |position| are required, all
    // other arguments may optionally be supplied. Pickups are immutable after creation.
    createPickup({ modelId, type = Pickup.kTypeDefault, position, respawnDelay = null,
                   interiors = null, interiorId = -1, virtualWorlds = null, virtualWorld = -1,
                   players = null, playerId = -1 } = {}) {
        const pickup = new this.pickupConstructor_(this);

        // Initializes the |pickup| with all the configuration passed to the manager.
        pickup.initialize({
            modelId, type, position,

            respawnDelay: respawnDelay ?? -1,

            streamDistance: 200.0,

            interiors: interiors ?? [ interiorId ],
            virtualWorlds: virtualWorlds ?? [ virtualWorld ],
            players: players ?? [ playerId ],
            areas: [ -1 ], 

            priority: 0,
        });

        this.pickups_.set(pickup.id, pickup);
        return pickup;
    }

    // ---------------------------------------------------------------------------------------------

    // Observes events for the pickups owned by this manager. |observer| can be added multiple
    // times, but will receive events only once.
    addObserver(observer) {
        this.observers_.add(observer);
    }

    // Removes |observer| from the set of objects that will be informed about pickup events.
    removeObserver(observer) {
        this.observers_.delete(observer);
    }

    // Notifies observers about the |eventName|, passing |...args| as the argument to the method
    // when it exists. The call will be bound to the observer's instance.
    notifyObservers(eventName, ...args) {
        for (let observer of this.observers_) {
            if (observer.__proto__.hasOwnProperty(eventName))
                observer.__proto__[eventName].call(observer, ...args);
        }
    }

    // ---------------------------------------------------------------------------------------------

    // Called when a player has picked up a pickup. The event is untrusted, so all given properties
    // will be checked before it will be forwarded to listeners.
    onPickupPickedUp(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player)
            return;  // the event was received for an invalid player

        const pickup = this.pickups_.get(event.pickupid);
        if (!pickup)
            return;  // the pickup is not known to JavaScript

        {
            const currentPickup = this.currentPickupForPlayer_.get(player);
            if (currentPickup === pickup)
                return;  // the player is already standing in the pickup

            // Fire the `onPlayerLeavePickup` event if they are suddenly standing in another pickup.
            if (currentPickup)
                this.notifyObservers('onPlayerLeavePickup', player, currentPickup);
        }

        this.currentPickupForPlayer_.set(player, pickup);

        // Fire the `onPlayerEnterPickup` event because they freshly entered the pickup.
        this.notifyObservers('onPlayerEnterPickup', player, pickup);

        // Schedule a respawn for the |pickup| since a player has picked it up.
        if (pickup.respawnDelay != -1) {
            this.currentPickupForPlayer_.delete(player);

            this.pickupRespawning_.add(pickup);
            this.pickups_.delete(pickup.id);

            pickup.respawnInternal();
            return;
        }

        // Run the watch function in an anonymous asynchronous function. This avoids blocking the
        // `onplayerpickuppickup` event until the player walks in another one again.
        (async() => {
            // Spin until the player leaves the pickup, has entered a different pickup, has
            // disconnected from Las Venturas Playground or the pickup has been destroyed.
            while (true) {
                await wait(PickupPositionValidationFrequency);

                if (!player.isConnected() || !pickup.isConnected())
                    break;  // either the player or the pickup is not valid anymore

                if (this.currentPickupForPlayer_.get(player) !== pickup)
                    break;  // the player has picked up another pickup since

                if (player.position.squaredDistanceTo(pickup.position) > PickupPositionValidDistanceSq)
                    break;  // the player has moved away from the pickup since
            }

            // Fire the `onPlayerLeavePickup` event if they're still standing in the pickup and both
            // the player and the pickup are still valid entities on the server.
            const currentPickup = this.currentPickupForPlayer_.get(player);
            if (currentPickup !== pickup)
                return;  // the player picked up another pickup since

            if (player.isConnected() && pickup.isConnected())
                this.notifyObservers('onPlayerLeavePickup', player, pickup);

            this.currentPickupForPlayer_.delete(player);
        })();
    }

    // ---------------------------------------------------------------------------------------------

    // Will reassociate the |pickup| with this PickupManager. Should only be used by the Pickup
    // implementation after the pickup has successfully respawned.
    didRespawnPickup(pickup) {
        this.pickupRespawning_.delete(pickup);
        this.pickups_.set(pickup.id, pickup);
    }

    // Removes the |pickup| from the maintained set of pickups. Should only be used by the Pickup
    // implementation to inform the manager about their disposal.
    didDisposePickup(pickup) {
        if (!this.pickups_.has(pickup.id) && !this.pickupRespawning_.has(pickup))
            throw new Error('Attempting to dispose an invalid pickup: ' + pickup);

        this.pickupRespawning_.delete(pickup);
        this.pickups_.delete(pickup.id);
    }

    // Removes all existing pickups from the server.
    dispose() {
        this.pickupRespawning_.forEach(pickup => pickup.dispose());
        this.pickups_.forEach(pickup => pickup.dispose());

        if (this.pickupRespawning_.size > 0 || this.pickups_.size > 0)
            throw new Error('There are remaining pickups after disposing all of them.');
    }
}
