// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// This class maintains a list of entities that can be conveniently disposed of as a group, for
// example temporary entities that exist because of a minigame. The entities may optionally be fixed
// to a particular Interior Id and Virtual World Id as well.
class ScopedEntities {
    constructor({ interiorId = 0, virtualWorld = 0 } = {}) {
        this.actors_ = new Set();
        this.areas_ = new Set();
        this.mapIcons_ = new Set();
        this.npcs_ = new Set();
        this.objects_ = new Set();
        this.pickups_ = new Set();
        this.textLabels_ = new Set();
        this.vehicles_ = new Set();

        this.interiorId_ = interiorId;
        this.virtualWorld_ = virtualWorld;
    }

    // ---------------------------------------------------------------------------------------------

    // Gets the Interior Id that this object is associated with.
    get interiorId() { return this.interiorId_; }

    // Gets the Virtual World that this object is associated with.
    get virtualWorld() { return this.virtualWorld_; }

    // ---------------------------------------------------------------------------------------------

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

    // ---------------------------------------------------------------------------------------------

    // Creates a circular area consisting of |radius| units around the |center|. The z-coordinate of
    // both the |center| and the player's position will be ignored.
    createCircularArea(center, radius, options = {}) {
        if (!this.areas_)
            throw new Error('Unable to create the area, this object has been disposed of.');

        if (this.interiorId_)
            options.interiors = [ this.interiorId_ ];

        if (this.virtualWorld_)
            options.virtualWorlds = [ this.virtualWorld_ ];

        const area = server.areaManager.createCircularArea(center, radius, options);

        this.areas_.add(area);
        return area;
    }

    // Creates a cubicle area consisting of the |rectangle|, from the |minimumZ| until the
    // |maximumZ| coordinates.
    createCubicalArea(rectangle, minimumZ, maximumZ, options = {}) {
        if (!this.areas_)
            throw new Error('Unable to create the area, this object has been disposed of.');

        if (this.interiorId_)
            options.interiors = [ this.interiorId_ ];

        if (this.virtualWorld_)
            options.virtualWorlds = [ this.virtualWorld_ ];

        const area =
            server.areaManager.createCubicalArea(rectangle, minimumZ, maximumZ, options);

        this.areas_.add(area);
        return area;
    }

    // Creates a vertically cylindrical area consisting of |radius| units around the |center|, from
    // the |minimumZ| until the |maximumZ| coordinates.
    createCylindricalArea(center, radius, minimumZ, maximumZ, options = {}) {
        if (!this.areas_)
            throw new Error('Unable to create the area, this object has been disposed of.');

        if (this.interiorId_)
            options.interiors = [ this.interiorId_ ];

        if (this.virtualWorld_)
            options.virtualWorlds = [ this.virtualWorld_ ];

        const area = server.areaManager.createCylindricalArea(center, radius, minimumZ,
                                                                   maximumZ, options);

        this.areas_.add(area);
        return area;
    }

    // Creates a polygonal area for each of the |points|, from the |minimumZ| until the |maximumZ|.
    // Each entry in |points| must be an array with two values, [x, y].
    createPolygonalArea(points, minimumZ, maximumZ, options = {}) {
        if (!this.areas_)
            throw new Error('Unable to create the area, this object has been disposed of.');

        if (this.interiorId_)
            options.interiors = [ this.interiorId_ ];

        if (this.virtualWorld_)
            options.virtualWorlds = [ this.virtualWorld_ ];

        const area =
            server.areaManager.createPolygonalArea(points, minimumZ, maximumZ, options);

        this.areas_.add(area);
        return area;
    }

    // Creates a rectangular area consisting of the |rectangle|. The z-coordinate of the player's
    // position will be ignored.
    createRectangularArea(rectangle, options = {}) {
        if (!this.areas_)
            throw new Error('Unable to create the area, this object has been disposed of.');

        if (this.interiorId_)
            options.interiors = [ this.interiorId_ ];

        if (this.virtualWorld_)
            options.virtualWorlds = [ this.virtualWorld_ ];

        const area = server.areaManager.createRectangularArea(rectangle, options);

        this.areas_.add(area);
        return area;
    }

    // Creates a spherical area consisting of |radius| units around the |center| for {x, y, z}.
    createSphericalArea(center, radius, options = {}) {
        if (!this.areas_)
            throw new Error('Unable to create the area, this object has been disposed of.');

        if (this.interiorId_)
            options.interiors = [ this.interiorId_ ];

        if (this.virtualWorld_)
            options.virtualWorlds = [ this.virtualWorld_ ];

        const area = server.areaManager.createSphericalArea(center, radius, options);

        this.areas_.add(area);
        return area;
    }

    // Returns whether the given |area| is owned by this set of entities.
    hasArea(area) { return this.areas_ && this.areas_.has(area); }

    // ---------------------------------------------------------------------------------------------

    // Creates a new map icon that's scoped to the lifetime of this object. The passed options must
    // match those accepted by the MapIconManager.createMapIcon() method.
    createMapIcon(options) {
        if (!this.mapIcons_)
            throw new Error('Unable to create the map icon, this object has been disposed of.');

        if (this.interiorId_)
            options.interiors = [ this.interiorId_ ];

        if (this.virtualWorld_)
            options.virtualWorlds = [ this.virtualWorld_ ];

        const mapIcon = server.mapIconManager.createMapIcon(options);

        this.mapIcons_.add(mapIcon);
        return mapIcon;
    }

    // Returns whether the given |mapIcon| is owned by this set of entities.
    hasMapIcon(mapIcon) { return this.mapIcons_ && this.mapIcons_.has(mapIcon); }

    // ---------------------------------------------------------------------------------------------

    // Creates a new NPC scoped to the lifetime of this object. The passed options must match those
    // accepted by NpcManager.createNpc() on the global Server object.
    createNpc(options) {
        if (!this.npcs_)
            throw new Error('Unable to create the NPC, this object has been disposed of.');

        const npc = server.npcManager.createNpc(options);

        // TODO: Associate the NPC with the correct interior and virtual world on spawn.

        this.npcs_.add(npc);
        return npc;
    }

    // Returns whether the |npc| belongs to this set of scoped entities.
    hasNpc(npc) { return this.npcs_ && this.npcs_.has(npc); }

    // ---------------------------------------------------------------------------------------------

    // Creates an object with |options|, which must match those by ObjectManager.createObject(). The
    // object will be removed automatically when this instance is being disposed of.
    createObject(options) {
        if (!this.objects_)
            throw new Error('Unable to create the object, this object has been disposed of.');

        if (this.interiorId_)
            options.interiors = [ this.interiorId_ ];

        if (this.virtualWorld_)
            options.virtualWorlds = [ this.virtualWorld_ ];

        const object = server.objectManager.createObject(options);

        this.objects_.add(object);
        return object;
    }

    // Returns whether |object| belongs to this set of scoped entities.
    hasObject(object) { return this.objects_ && this.objects_.has(object); }

    // ---------------------------------------------------------------------------------------------

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

    // ---------------------------------------------------------------------------------------------

    // Creates the text label with the |options|, which must match those of the TextLabelManager.
    // The object will be removed automatically when this instance is being disposed of.
    createTextLabel(options) {
        if (!this.textLabels_)
            throw new Error('Unable to create the text label, this object has been disposed of.');

        if (this.interiorId_)
            options.interiors = [ this.interiorId_ ];

        if (this.virtualWorld_)
            options.virtualWorlds = [ this.virtualWorld_ ];

        const textLabel = server.textLabelManager.createTextLabel(options);

        this.textLabels_.add(textLabel);
        return textLabel;
    }

    // Returns whether the |textLabel| belongs to this set of scoped text labels.
    hasTextLabel(textLabel) { return this.textLabels_ && this.textLabels_.has(textLabel); }

    // ---------------------------------------------------------------------------------------------

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

    // ---------------------------------------------------------------------------------------------

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

        this.areas_.forEach(safeDisposeEntity);
        this.areas_ = null;

        this.mapIcons_.forEach(safeDisposeEntity);
        this.mapIcons_ = null;

        this.npcs_.forEach(npc => npc.disconnect());
        this.npcs_ = null;

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

export default ScopedEntities;
