// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const EntityStreamerGlobal = require('features/streamer/entity_streamer_global.js');
const ScopedEntities = require('entities/scoped_entities.js');

// Implementation for a vehicle that's able to stream vehicles for all players. This class is
// intended to be used with stored entities that are StoredVehicle instances.
class VehicleStreamer extends EntityStreamerGlobal {
    constructor({ maxVisible = 1000, streamingDistance = 300 } = {}) {
        super({ maxVisible, streamingDistance });

        // The entities that have been created by this vehicle streamer.
        this.entities_ = new ScopedEntities();

        // Mapping of storedVehicle instances to the Vehicle instance for live vehicles.
        this.vehicles_ = new Map();
    }

    // ---------------------------------------------------------------------------------------------
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
    // ---------------------------------------------------------------------------------------------

    // Creates the vehicle represented by |storedVehicle|.
    createEntity(storedVehicle) {
        if (this.vehicles_.has(storedVehicle))
            throw new Error('Attempting to create a vehicle that already exists.');

        this.vehicles_.set(storedVehicle, this.entities_.createVehicle({
            modelId: storedVehicle.modelId,
            position: storedVehicle.position,
            rotation: storedVehicle.rotation,
            interiorId: storedVehicle.interiorId,
            virtualWorld: storedVehicle.virtualWorld,

            primaryColor: storedVehicle.primaryColor,
            secondaryColor: storedVehicle.secondaryColor,
            paintjob: storedVehicle.paintjob,
            siren: storedVehicle.siren,
            respawnDelay: storedVehicle.respawnDelay
        }));
    }

    // Destroys the vehicle represented by |storedVehicle|.
    deleteEntity(storedVehicle) {
        const vehicle = this.vehicles_.get(storedVehicle);
        if (!vehicle)
            throw new Error('Attempting to delete an invalid vehicle.');

        vehicle.dispose();

        this.vehicles_.delete(storedVehicle);
    }

    dispose() {
        this.vehicles_.clear();

        this.entities_.dispose();
        this.entities_ = null;

        super.dispose();
    }
}

exports = VehicleStreamer;
