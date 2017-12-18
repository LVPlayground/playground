// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import StoredVehicle from 'features/streamer/stored_vehicle.js';

// The vehicle controller is responsible for the vehicles associated with houses. The controller
// works based on HouseLocation and HouseVehicle instances, communicating with the VehicleStreamer
// to make sure that the vehicles get created when they're required.
class HouseVehicleController {
    constructor(streamer) {
        this.streamer_ = streamer;
        this.streamer_.addReloadObserver(
            this, HouseVehicleController.prototype.onStreamerReloaded);

        // Map of HouseLocation instances to sets of the associated HouseVehicles.
        this.locationVehicles_ = new Map();

        // Map of HouseVehicle instances to the StoredVehicles representing them.
        this.storedVehicles_ = new Map();
    }

    // Gets the total number of vehicles that have been created as part of houses.
    get count() { return this.storedVehicles_.size; }

    // Gets the vehicle streamer that this controller operates on.
    get streamer() { return this.streamer_().getVehicleStreamer(); }

    // ---------------------------------------------------------------------------------------------

    // Creates the |houseVehicle| associated with the |location|.
    createVehicle(location, houseVehicle) {
        if (!this.locationVehicles_.has(location))
            this.locationVehicles_.set(location, new Set());

        const parkingLot = houseVehicle.parkingLot;
        const storedVehicle = new StoredVehicle({
            modelId: houseVehicle.modelId,
            position: parkingLot.position,
            rotation: parkingLot.rotation,
            interiorId: parkingLot.interiorId,
            virtualWorld: 0 /* main world */,

            // TODO: Support |primaryColor|, |secondaryColor|, |paintjob|, and |siren|.

            respawnDelay: 180 /* 3 minutes */
        });

        this.storedVehicles_.set(houseVehicle, storedVehicle);
        this.locationVehicles_.get(location).add(houseVehicle);

        this.streamer.add(storedVehicle);
    }

    // Removes the |houseVehicle| that used to be associated with the |location|.
    removeVehicle(location, houseVehicle) {
        const houseVehicles = this.locationVehicles_.get(location);
        if (!houseVehicles)
            throw new Error('Invalid |location| passed while removing a house vehicle.');

        if (!houseVehicles.has(houseVehicle))
            throw new Error('The |houseVehicle| is not associated with the |location|.');

        const storedVehicle = this.storedVehicles_.get(houseVehicle);
        if (!storedVehicle)
            throw new Error('Invalid |houseVehicle| passed while removing a house vehicle.');

        this.storedVehicles_.delete(houseVehicle);
        this.streamer.delete(storedVehicle);

        houseVehicles.delete(houseVehicle);
        if (!houseVehicles.size)
            this.locationVehicles_.delete(location);
    }

    // Removes all vehicles that used to be associated with the |location|.
    removeVehiclesForLocation(location) {
        const houseVehicles = this.locationVehicles_.get(location);
        if (!houseVehicles)
            return;

        for (const houseVehicle of houseVehicles) {
            const storedVehicle = this.storedVehicles_.get(houseVehicle);
            if (!storedVehicle)
                throw new Error('No stored vehicle for the given |houseVehicle|.');

            this.storedVehicles_.delete(houseVehicle);
            this.streamer.delete(storedVehicle);
        }

        this.locationVehicles_.delete(location);
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the streamer has been reloaded, in which case we need to reattach all the known
    // vehicles associated with houses.
    onStreamerReloaded() {
        for (const storedVehicle of this.storedVehicles_.values())
            this.streamer.add(storedVehicle, true /* lazy */);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.streamer_.removeReloadObserver(this);

        this.locationVehicles_.clear();
        this.locationVehicles_ = null;

        for (const storedVehicle of this.storedVehicles_.values())
            this.streamer.delete(storedVehicle);

        this.storedVehicles_.clear();
        this.storedVehicles_ = null;
    }
}

export default HouseVehicleController;
