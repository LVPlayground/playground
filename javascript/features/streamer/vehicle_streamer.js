// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const EntityStreamerGlobal = require('features/streamer/entity_streamer_global.js');
const ScopedEntities = require('entities/scoped_entities.js');

// Implementation for a vehicle that's able to stream vehicles for all players. This class is
// intended to be used with stored entities that are StoredVehicle instances. The vehicle streamer
// will automatically handle respawn delays for the vehicles created through it.
class VehicleStreamer extends EntityStreamerGlobal {
    constructor({ maxVisible = 1000, streamingDistance = 300 } = {}) {
        super({ maxVisible, streamingDistance });

        // The entities that have been created by this vehicle streamer.
        this.entities_ = new ScopedEntities();

        // Mapping of StoredVehicle instances to the Vehicle instance for live vehicles.
        this.vehicles_ = new Map();

        // Mapping of Vehicle instances to the StoredVehicle instances for live vehicles.
        this.storedVehicles_ = new Map();

        // Observe the Vehicle Manager to get events associated with the managed vehicles.
        server.vehicleManager.addObserver(this);
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
    //     void clear();
    //
    // Do not use the createEntity() and deleteEntity() methods below- they are implementation
    // details of the streamer. Use the add() and delete() methods instead.
    //
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

    // Called when |vehicle| has been destroyed. Will schedule it to be respawned.
    onVehicleDeath(vehicle) {
        const storedVehicle = this.storedVehicles_.get(vehicle);
        if (!storedVehicle)
            return;  // the |vehicle| is not part of this streamer

        // TODO: Schedule a respawn if the vehicle is not occupied by a player.
    }

    // ---------------------------------------------------------------------------------------------

    // Returns the vehicle associated with |storedVehicle|. Only to be used for testing purposes.
    getVehicleForTesting(storedVehicle) {
        return this.vehicles_.get(storedVehicle) || null;
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.vehicleManager.removeObserver(this);

        this.vehicles_.clear();
        this.storedVehicles_.clear();

        this.entities_.dispose();
        this.entities_ = null;

        super.dispose();
    }
}

exports = VehicleStreamer;
