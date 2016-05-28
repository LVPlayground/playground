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
        this.pickups_ = new Set();
        this.textLabels_ = new Set();
        this.vehicles_ = new Set();

        this.interiorId_ = interiorId;
        this.virtualWorld_ = virtualWorld;
    }

    // Gets the Interior Id that this object is associated with.
    get interiorId() { return this.interiorId_; }

    // Gets the Virtual World that this object is associated with.
    get virtualWorld() { return this.virtualWorld_; }

    // Creates a new actor scoped to the lifetime of this object. The passed options must match
    // those accepted by ActorManager.createActor() on the global Server object.
    createActor(options) {
        if (!this.actors_)
            throw new Error('Unable to create the actor, this object has been disposed of.');

        const actor = server.actorManager.createActor(options);

        // Note that actors simultaneously exist in all interiors, so there is no need to explicitly
        // link them to the one given to this object's constructor.

        if (this.virtualWorld_)
            actor.virtualWorld = this.virtualWorld_;

        this.actors_.add(actor);
        return actor;
    }

    // Returns whether the |actor| belongs to this set of scoped entities.
    hasActor(actor) { return this.actors_ && this.actors_.has(actor); }

    // Creates an object with |options|, which must match those by ObjectManager.createObject(). The
    // object will be removed automatically when this instance is being disposed of.
    createObject(options) {
        if (!this.objects_)
            throw new Error('Unable to create the object, this object has been disposed of.');

        if (this.interiorId_)
            options.interiorId = this.interiorId_;

        if (this.virtualWorld_)
            options.virtualWorld = this.virtualWorld_;

        const object = server.objectManager.createObject(options);

        this.objects_.add(object);
        return object;
    }

    // Returns whether |object| belongs to this set of scoped entities.
    hasObject(object) { return this.objects_ && this.objects_.has(object); }

    // Creates the pickup with the |options|, which must match those of the PickupManager. The
    // pickup will be removed automatically when this instance is being disposed of.
    createPickup(options) {
        if (!this.pickups_)
            throw new Error('Unable to create the pickup, this object has been disposed of.');

        // Note that pickups exist in all interiors simultaneously.

        if (this.virtualWorld_)
            options.virtualWorld = this.virtualWorld_;

        const pickup = server.pickupManager.createPickup(options);

        this.pickups_.add(pickup);
        return pickup;
    }

    // Returns whether the |pickup| belongs to this set of scoped pickups.
    hasPickup(pickup) { return this.pickups_ && this.pickups_.has(pickup); }

    // Creates the text label with the |options|, which must match those of the TextLabelManager.
    // The object will be removed automatically when this instance is being disposed of.
    createTextLabel(options) {
        if (!this.textLabels_)
            throw new Error('Unable to create the text label, this object has been disposed of.');

        // Note that text labels exist in all interiors simultaneously.

        if (this.virtualWorld_)
            options.virtualWorld = this.virtualWorld_;

        const textLabel = server.textLabelManager.createTextLabel(options);

        this.textLabels_.add(textLabel);
        return textLabel;
    }

    // Returns whether the |textLabel| belongs to this set of scoped text labels.
    hasTextLabel(textLabel) { return this.textLabels_ && this.textLabels_.has(textLabel); }

    // Creates a vehicle scoped to the lifetime of this object. The passed arguments must match
    // those accepted by VehicleManager.createVehicle() on the global Server object.
    createVehicle(options) {
        if (!this.vehicles_)
            throw new Error('Unable to create the vehicle, this object has been disposed of.');

        const vehicle = server.vehicleManager.createVehicle(options);

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

        this.pickups_.forEach(safeDisposeEntity);
        this.pickups_ = null;

        this.textLabels_.forEach(safeDisposeEntity);
        this.textLabels_ = null;

        this.vehicles_.forEach(safeDisposeEntity);
        this.vehicles_ = null;
    }
}

exports = ScopedEntities;
