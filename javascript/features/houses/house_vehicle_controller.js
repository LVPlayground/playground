// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ScopedEntities = require('entities/scoped_entities.js');

// The vehicle controller is responsible for the vehicles associated with houses. The vehicles
// themselves are stored as HouseVehicle instances, and managed by the manager.
class HouseVehicleController {
    constructor() {
        this.entities_ = new ScopedEntities();

        // Maps of HouseVehicle instances to the associated Vehicle entity, and vice versa.
        this.vehicleEntities_ = new Map();
        this.vehicleContainers_ = new Map();

        // Map of |location| instances to sets of the associated vehicles.
        this.locationVehicles_ = new Map();
    }

    // Gets the number of vehicles that have currently been created.
    get count() { return this.vehicleEntities_.size; }

    // Creates the |vehicle| associated with the |location|.
    createVehicle(location, vehicle) {
        if (!this.locationVehicles_.has(location))
            this.locationVehicles_.set(location, new Set());

        const parkingLot = vehicle.parkingLot;
        const entity = this.entities_.createVehicle({
            modelId: vehicle.modelId,
            position: parkingLot.position,
            rotation: parkingLot.rotation,
            interiorId: parkingLot.interiorId
        });

        this.vehicleEntities_.set(vehicle, entity);
        this.vehicleContainers_.set(entity, vehicle);

        this.locationVehicles_.get(location).add(vehicle);
    }

    // Removes the |vehicle| that used to be associated with the |location|.
    removeVehicle(location, vehicle) {
        const vehicles = this.locationVehicles_.get(location);
        if (!vehicles)
            throw new Error('Invalid location passed while removing a house vehicle.');

        const entity = this.vehicleEntities_.get(vehicle);
        if (!entity || !vehicles.has(vehicle))
            throw new Error('Invalid vehicle passed while removing a house vehicle.');

        entity.dispose();

        this.vehicleEntities_.delete(vehicle);
        this.vehicleContainers_.delete(entity);

        vehicles.delete(vehicle);
    }

    // Removes all vehicles that used to be associated with the |location|.
    removeVehiclesForLocation(location) {
        const vehicles = this.locationVehicles_.get(location);
        if (!vehicles)
            return;

        // Make a copy of the list of vehicles since we'll be modifying |vehicles|.
        Array.from(vehicles).forEach(vehicle =>
            this.removeVehicle(location, vehicle));
    }

    dispose() {
        this.entities_.dispose();
        this.entities_ = null;
    }
}

exports = HouseVehicleController;
