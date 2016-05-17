// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// An instance of the scoped entities class enables you to create entities for usage in a temporary
// environment, for example a minigame, that can all be removed at once by calling the dispose()
// method. 
class ScopedEntities {
    constructor() {
        this.actors_ = new Set();
        this.objects_ = new Set();
        this.vehicles_ = new Set();
    }

    // Creates a new actor scoped to the lifetime of this object. The passed arguments must match
    // those accepted by ActorManager.createActor() on the global Server object.
    createActor(...parameters) {
        const actor = server.actorManager.createActor(...parameters);

        this.actors_.add(actor);
        return actor;
    }

    // Returns whether the |actor| belongs to this set of scoped entities.
    hasActor(actor) { return this.actors_.has(actor); }

    // Creates an object with |parameters|. The object will be removed automatically when this
    // instance is being disposed of.
    createObject(...parameters) {
        let object = new GameObject(...parameters);
        if (object === null)
            return null;

        this.objects_.push(object);
        return object;
    }

    // Creates a vehicle scoped to the lifetime of this object. The passed arguments must match
    // those accepted by VehicleManager.createVehicle() on the global Server object.
    createVehicle(...parameters) {
        const vehicle = server.vehicleManager.createVehicle(...parameters);

        this.vehicles_.add(vehicle);
        return vehicle;
    }

    // Returns whether the |vehicle| belongs to this set of scoped entities.
    hasVehicle(vehicle) { return this.vehicles_.has(vehicle); }

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

        // TODO(Russell): Introduce an ObjectManager global to the Server object.
        this.objects_.forEach(object => object.dispose());

        this.vehicles_.forEach(safeDisposeEntity);
        this.vehicles_ = null;
    }
}

exports = ScopedEntities;
