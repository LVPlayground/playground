// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// This class maintains a list of entities that can be conveniently disposed of as a group, for
// example temporary entities that exist because of a minigame. The entities may optionally be fixed
// to a particular Interior Id and Virtual World Id as well.
class ScopedEntities {
    constructor({ interiorId = 0, virtualWorld = 0 } = {}) {
        this.actors_ = new Set();
        this.objects_ = new Set();
        this.vehicles_ = new Set();

        this.interiorId_ = interiorId;
        this.virtualWorld_ = virtualWorld;
    }

    // Gets the Interior Id that this object is associated with.
    get interiorId() { return this.interiorId_; }

    // Gets the Virtual World that this object is associated with.
    get virtualWorld() { return this.virtualWorld_; }

    // Creates a new actor scoped to the lifetime of this object. The passed arguments must match
    // those accepted by ActorManager.createActor() on the global Server object.
    createActor(...parameters) {
        if (!this.actors_)
            throw new Error('Unable to create the actor, this object has been disposed of.');

        const actor = server.actorManager.createActor(...parameters);

        // Note that actors simultaneously exist in all interiors, so there is no need to explicitly
        // link them to the one given to this object's constructor.

        if (this.virtualWorld_)
            actor.virtualWorld = this.virtualWorld_;

        this.actors_.add(actor);
        return actor;
    }

    // Returns whether the |actor| belongs to this set of scoped entities.
    hasActor(actor) { return this.actors_ && this.actors_.has(actor); }

    // Creates an object with |parameters|. The object will be removed automatically when this
    // instance is being disposed of.
    createObject(...parameters) {
        let object = new GameObject(...parameters);
        if (object === null)
            return null;

        this.objects_.add(object);
        return object;
    }

    // Creates a vehicle scoped to the lifetime of this object. The passed arguments must match
    // those accepted by VehicleManager.createVehicle() on the global Server object.
    createVehicle(...parameters) {
        if (!this.vehicles_)
            throw new Error('Unable to create the vehicle, this object has been disposed of.');

        const vehicle = server.vehicleManager.createVehicle(...parameters);

        if (this.interiorId_)
            vehicle.interiorId = this.interiorId_;

        if (this.virtualWorld_)
            vehicle.virtualWorld = this.virtualWorld_;

        this.vehicles_.add(vehicle);
        return vehicle;
    }

    // Returns whether the |vehicle| belongs to this set of scoped entities.
    hasVehicle(vehicle) { return this.vehicles_ && this.vehicles_.has(vehicle); }

    // Disposes of all entities that were created through this ScopedEntities instance. Remaining
    // references to the entity objects will indicate that they're not connected anymore.
    dispose() {
        // Safely disposes of an entity by first confirming whether it's still connected.
        const safeDisposeEntity = entity => {
            if (entity.isConnected())
                entity.dispose();
        };

        this.actors_.forEach(safeDisposeEntity);
        this.actors_ = null;

        this.objects_.forEach(safeDisposeEntity);
        this.objects_ = null;

        this.vehicles_.forEach(safeDisposeEntity);
        this.vehicles_ = null;
    }
}

exports = ScopedEntities;
