// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const EntityStreamerGlobal = require('features/streamer/entity_streamer_global.js');
const ScopedEntities = require('entities/scoped_entities.js');

// Implementation for a streamer that's able to stream pickups for all players. This class is
// intended to be used with stored entities that are StoredPickup instances.
class PickupStreamer extends EntityStreamerGlobal {
    constructor({ maxVisible = 500, streamingDistance = 150 } = {}) {
        super({ maxVisible, streamingDistance });

        // The entities that have been created by this pickup streamer.
        this.entities_ = new ScopedEntities();

        // Mapping of StoredPickup instances to the Pickup instance, and vice versa.
        this.pickups_ = new Map();
        this.storedPickups_ = new Map();

        server.pickupManager.addObserver(this);
    }

    // Gets the number of pickups that are currently streamed in.
    get streamedSize() { return this.pickups_.size; }

    // ---------------------------------------------------------------------------------------------
    //
    // Interface of the PickupStreamer class:
    //
    //     readonly attribute number maxVisible;
    //     readonly attribute number streamedSize;
    //     readonly attribute number streamingDistance;
    //     readonly attribute number size;
    //
    //     async stream();
    //
    //     boolean add(storedPickup, lazy = false);
    //     boolean delete(storedPickup);
    //
    //     Promise query(position);
    //
    //     void optimise();
    //     void clear();
    //
    // Do not use the createEntity() and deleteEntity() methods below- they are implementation
    // details of the streamer. Use the add() and delete() methods instead.
    //
    // ---------------------------------------------------------------------------------------------

    // Creates the pickup represented by |storedPickup|.
    createEntity(storedPickup) {
        if (this.pickups_.has(storedPickup))
            throw new Error('Attempting to create a pickup that already exists.');

        const pickup = this.entities_.createPickup({
            modelId: storedPickup.modelId,
            position: storedPickup.position,
            virtualWorld: storedPickup.virtualWorld,
            type: storedPickup.type,
            respawnDelay: storedPickup.respawnDelay
        });

        this.pickups_.set(storedPickup, pickup);
        this.storedPickups_.set(pickup, storedPickup);

        return pickup;
    }

    // Destroys the pickup represented by |storedPickup|.
    deleteEntity(storedPickup) {
        const pickup = this.pickups_.get(storedPickup);
        if (!pickup)
            throw new Error('Attempting to delete an invalid pickup.');

        this.pickups_.delete(storedPickup);
        this.storedPickups_.delete(pickup);

        pickup.dispose();
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the |player| has entered |pickup|.
    onPlayerEnterPickup(player, pickup) {
        const storedPickup = this.storedPickups_.get(pickup);
        if (!storedPickup)
            return;  // the |pickup| is not managed by the streamer

        if (storedPickup.enterFn)
            storedPickup.enterFn(player, pickup);
    }

    // Called when the |player| has left the |pickup|.
    onPlayerLeavePickup(player, pickup) {
        const storedPickup = this.storedPickups_.get(pickup);
        if (!storedPickup)
            return;  // the |pickup| is not managed by the streamer

        if (storedPickup.leaveFn)
            storedPickup.leaveFn(player, pickup);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        super.dispose();

        server.pickupManager.removeObserver(this);

        this.entities_.dispose();
        this.entities_ = null;

        this.pickups_.clear();
        this.storedPickups_.clear();
    }
}

exports = PickupStreamer;
