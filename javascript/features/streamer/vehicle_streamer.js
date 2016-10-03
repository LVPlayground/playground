// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const EntityStreamerGlobal = require('features/streamer/entity_streamer_global.js');
const ScopedCallbacks = require('base/scoped_callbacks.js');
const ScopedEntities = require('entities/scoped_entities.js');

// Pin that will be used to keep vehicles alive that have recently been used.
const RecentUsagePin = Symbol();

// Implementation for a vehicle that's able to stream vehicles for all players. This class is
// intended to be used with stored entities that are StoredVehicle instances. The vehicle streamer
// will automatically handle respawn delays for the vehicles created through it.
class VehicleStreamer extends EntityStreamerGlobal {
    constructor({ maxVisible = 1000, streamingDistance = 300 } = {}) {
        super({ maxVisible, streamingDistance });

        // The entities that have been created by this vehicle streamer.
        this.entities_ = new ScopedEntities();

        // Mapping of StoredVehicle instances to the Vehicle instance, and vice versa.
        this.vehicles_ = new Map();
        this.storedVehicles_ = new Map();

        // Mapping of live vehicles to their respawn tokens, to make sure we don't accidentially
        // respawn vehicles when activity occurs after scheduling a respawn.
        this.respawnTokens_ = new Map();

        // Observe the PlayerManager to learn about players entering or leaving vehicles, and the
        // VehicleManager to get events associated with the managed vehicles.
        server.playerManager.addObserver(this);
        server.vehicleManager.addObserver(this);

        // Observe the `vehiclestreamin` event to provide automatic locking of doors.
        this.callbacks_ = new ScopedCallbacks();
        this.callbacks_.addEventListener(
            'vehiclestreamin', VehicleStreamer.prototype.onVehicleStreamIn.bind(this));
    }

    // ---------------------------------------------------------------------------------------------
    //
    // Interface of the VehicleStreamer class:
    //
    //     readonly attribute number maxVisible;
    //     readonly attribute number streamingDistance;
    //     readonly attribute number size;
    //
    //     async stream();
    //
    //     boolean add(storedVehicle, lazy = false);
    //     boolean delete(storedVehicle);
    //
    //     void pin(storedVehicle, type);
    //     void isPinned(storedVehicle, type);
    //     void unpin(storedVehicle, type);
    //
    //     Promise query(position);
    //
    //     Vehicle getLiveVehicle(storedVehicle);
    //     StoredVehicle getStoredVehicle(vehicle);
    //
    //     bool synchronizeAccess(storedVehicle);
    //
    //     void optimise();
    //     void clear();
    //
    // Do not use the createEntity() and deleteEntity() methods below- they are implementation
    // details of the streamer. Use the add() and delete() methods instead.
    //
    // ---------------------------------------------------------------------------------------------

    // Queries the streamer to calculate the number of vehicles, as well as vehicle models, within
    // streaming radius of the given |position|. It also finds the closest live vehicle to the
    // position, which can be used for commands. Should be used sparsely.
    async query(position) {
        const storedVehicles = await super.query(position);
        const models = new Set();

        for (const storedVehicle of storedVehicles)
            models.add(storedVehicle.modelId);

        let closestVehicle = null;
        let closestDistance = Number.MAX_SAFE_INTEGER;

        for (const vehicle of this.vehicles_.values()) {
            const squaredDistance = vehicle.position.distanceTo(position);
            if (squaredDistance > closestDistance)
                continue;

            closestVehicle = vehicle;
            closestDistance = squaredDistance;
        }
        
        return {
            vehicles: storedVehicles.size,
            models: models.size,
            closestVehicle: closestVehicle
        };
    }

    // Returns the live vehicle that is representing the |storedVehicle|. NULL when there is none.
    getLiveVehicle(storedVehicle) {
        return this.vehicles_.get(storedVehicle) || null;
    }

    // Returns the StoredVehicle that is represented by the |vehicle|. NULL when there is none.
    getStoredVehicle(vehicle) {
        return this.storedVehicles_.get(vehicle) || null;
    }

    // Synchronizes access to the vehicles for the |storedVehicle|.
    synchronizeAccess(storedVehicle) {
        const vehicle = this.vehicles_.get(storedVehicle);
        if (!vehicle)
            return false;  // the |storedVehicle| is not live

        for (const player of server.playerManager) {
            const hasAccess =
                !storedVehicle.accessFn || storedVehicle.accessFn(player, storedVehicle);

            if (!hasAccess)
                vehicle.lockForPlayer(player);
            else
                vehicle.unlockForPlayer(player);
        }
    }

    // ---------------------------------------------------------------------------------------------

    // Creates the vehicle represented by |storedVehicle|.
    createEntity(storedVehicle) {
        if (this.vehicles_.has(storedVehicle))
            throw new Error('Attempting to create a vehicle that already exists.');

        const vehicle = this.entities_.createVehicle({
            modelId: storedVehicle.modelId,
            position: storedVehicle.position,
            rotation: storedVehicle.rotation,
            interiorId: storedVehicle.interiorId,
            virtualWorld: storedVehicle.virtualWorld,

            primaryColor: storedVehicle.primaryColor,
            secondaryColor: storedVehicle.secondaryColor,
            paintjob: storedVehicle.paintjob,
            siren: storedVehicle.siren,
            respawnDelay: -1 /* we handle our own respawn delay */
        });

        this.vehicles_.set(storedVehicle, vehicle);
        this.storedVehicles_.set(vehicle, storedVehicle);
    }

    // Destroys the vehicle represented by |storedVehicle|.
    deleteEntity(storedVehicle) {
        const vehicle = this.vehicles_.get(storedVehicle);
        if (!vehicle)
            throw new Error('Attempting to delete an invalid vehicle.');

        this.vehicles_.delete(storedVehicle);
        this.storedVehicles_.delete(vehicle);

        vehicle.dispose();
    }

    // ---------------------------------------------------------------------------------------------

    // Schedules the |vehicle| to be respawned after the delayed configured in |storedVehicle|.
    async scheduleVehicleForRespawn(vehicle, storedVehicle, timeMultipler = 1) {
        const respawnTime = storedVehicle.respawnDelay * timeMultipler;
        if (respawnTime < 0 /* no automated respawn */) {
            this.unpin(storedVehicle, RecentUsagePin);
            return;
        }

        const token = Symbol('Respawn token for vehicle #' + vehicle.id);

        this.respawnTokens_.set(vehicle, token);

        await seconds(respawnTime);

        if (!vehicle.isConnected() || this.respawnTokens_.get(vehicle) !== token)
            return;  // the |vehicle| has been removed, or the respawn token expired

        this.unpin(storedVehicle, RecentUsagePin);
        this.respawnTokens_.delete(vehicle);

        vehicle.respawn();
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the |player| has entered the |vehicle|. Will invalidate any respawn tokens.
    onPlayerEnterVehicle(player, vehicle) {
        const storedVehicle = this.storedVehicles_.get(vehicle);
        if (!storedVehicle)
            return;  // the |vehicle| is not part of this streamer

        this.pin(storedVehicle, RecentUsagePin);
        this.respawnTokens_.delete(vehicle);
    }

    // Called when the |player| has left the |vehicle|. Will schedule it to be respawned if there
    // are no more occupants left in the vehicle.
    onPlayerLeaveVehicle(player, vehicle) {
        const storedVehicle = this.storedVehicles_.get(vehicle);
        if (!storedVehicle)
            return;  // the |vehicle| is not part of this streamer

        if (vehicle.occupantCount > 1)
            return;  // there are still players left in the vehicle

        this.scheduleVehicleForRespawn(vehicle, storedVehicle);
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the vehicle streams in for a particular player. Will check whether the player has
    // access to enter the vehicle, and lock the doors if they don't.
    onVehicleStreamIn(event) {
        const player = server.playerManager.getById(event.forplayerid);
        const vehicle = server.vehicleManager.getById(event.vehicleid);

        if (!player || !vehicle)
            return;  // invalid data was supplied in the |event|

        const storedVehicle = this.storedVehicles_.get(vehicle);
        if (!storedVehicle)
            return;  // the |vehicle| is not managed by this streamer

        if (!storedVehicle.accessFn)
            return;  // the |vehicle| does not provide a function for access checking.

        const hasAccess = storedVehicle.accessFn(player, storedVehicle);
        if (!hasAccess)
            vehicle.lockForPlayer(player);
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the |vehicle| has spawned. Will call the vehicle's spawn function if it exists.
    onVehicleSpawn(vehicle) {
        const storedVehicle = this.storedVehicles_.get(vehicle);
        if (!storedVehicle)
            return;  // the |vehicle| is not part of this streamer

        if (storedVehicle.respawnFn)
            storedVehicle.respawnFn(vehicle, storedVehicle);
    }

    // Called when |vehicle| has been destroyed. Will schedule it to be respawned after a fourth of
    // the time of the normal respawn delay, since the vehicle is useless in its current form.
    onVehicleDeath(vehicle) {
        const storedVehicle = this.storedVehicles_.get(vehicle);
        if (!storedVehicle)
            return;  // the |vehicle| is not part of this streamer

        if (vehicle.occupantCount > 0)
            return;  // there are still players left in the vehicle

        this.scheduleVehicleForRespawn(vehicle, storedVehicle, 0.25 /* timeMultipler */);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.callbacks_.dispose();
        this.callbacks_ = null;

        server.vehicleManager.removeObserver(this);
        server.playerManager.removeObserver(this);

        this.respawnTokens_.clear();
        this.vehicles_.clear();
        this.storedVehicles_.clear();

        this.entities_.dispose();
        this.entities_ = null;

        super.dispose();
    }
}

exports = VehicleStreamer;
