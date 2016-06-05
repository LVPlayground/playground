// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ScopedCallbacks = require('base/scoped_callbacks.js');

// Number of milliseconds after which it should be confirmed whether the player is still standing
// in the given pickup. This works around an issue where SA-MP fires the event too frequently.
const PickupPositionExpirationTime = 1000;

// The pickup manager maintains the list of pickups created for Las Venturas Playground, and is in
// charge of delegating events related to those pickups.
class PickupManager {
    constructor(pickupConstructor = Pickup) {
        this.pickupConstructor_ = pickupConstructor;
        this.pickups_ = new Map();

        this.observers_ = new Set();

        this.callbacks_ = new ScopedCallbacks();
        this.callbacks_.addEventListener(
            'playerpickuppickup', PickupManager.prototype.onPickupPickedUp.bind(this));
    }

    // Gets the number of pickups currently created on the server.
    get count() { return this.pickups_.size; }

    // Creates a new pickup with the given options. The |modelId| and |position| are required, all
    // other arguments may optionally be supplied. Pickups are immutable after creation.
    createPickup({ modelId, position, type = Pickup.TYPE_PERSISTENT, virtualWorld = 0 } = {}) {
        const pickup = new this.pickupConstructor_(this, modelId, type, position, virtualWorld);

        this.pickups_.set(pickup.id, pickup);

        return pickup;
    }

    // Observes events for the pickups owned by this manager. |observer| can be added multiple
    // times, but will receive events only once.
    addObserver(observer) {
        this.observers_.add(observer);
    }

    // Removes |observer| from the set of objects that will be informed about pickup events.
    removeObserver(observer) {
        this.observers_.delete(observer);
    }

    // Called when a player has picked up a pickup. The event is untrusted, so all given properties
    // will be checked before it will be forwarded to listeners.
    async onPickupPickedUp(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player)
            return;  // the event was received for an invalid player

        const pickup = this.pickups_.get(event.pickupid);
        if (!pickup)
            return;  // the pickup is not known to JavaScript

        this.notifyObservers('onPlayerEnterPickup', player, pickup);

        await wait(PickupPositionExpirationTime);

        this.notifyObservers('onPlayerLeavePickup', player, pickup);
    }

    // Notifies observers about the |eventName|, passing |...args| as the argument to the method
    // when it exists. The call will be bound to the observer's instance.
    notifyObservers(eventName, ...args) {
        for (let observer of this.observers_) {
            if (observer.__proto__.hasOwnProperty(eventName))
                observer.__proto__[eventName].call(observer, ...args);
        }
    }

    // Removes the |pickup| from the maintained set of pickups. Should only be used by the Pickup
    // implementation to inform the manager about their disposal.
    didDisposePickup(pickup) {
        if (!this.pickups_.has(pickup.id))
            throw new Error('Attempting to dispose an invalid pickup: ' + pickup);

        this.pickups_.delete(pickup.id);
    }

    // Removes all existing pickups from the server.
    dispose() {
        this.pickups_.forEach(pickup => pickup.dispose());

        if (this.pickups_.size != 0)
            throw new Error('There are remaining pickups after disposing all of them.');
    }
}

exports = PickupManager;
