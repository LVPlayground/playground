// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { StreamableVehicleInfo } from 'features/streamer/streamable_vehicle_info.js';

// The vehicle controller is responsible for the vehicles associated with houses. The controller
// works based on HouseLocation and HouseVehicle instances, communicating with the VehicleStreamer
// to make sure that the vehicles get created when they're required.
export default class HouseVehicleController {
    settings_ = null;
    streamer_ = null;

    locationVehicles_ = null;
    streamableVehicles_ = null;

    constructor(settings, streamer) {
        this.settings_ = settings;

        this.streamer_ = streamer;
        this.streamer_.addReloadObserver(
            this, HouseVehicleController.prototype.onStreamerReloaded);

        // Map of HouseLocation instances to sets of the associated HouseVehicles.
        this.locationVehicles_ = new Map();

        // Map of HouseVehicle instances to the StreamableVehicle instances representing them.
        this.streamableVehicles_ = new Map();
    }

    // Gets the total number of vehicles that have been created as part of houses.
    get count() { return this.streamableVehicles_.size; }

    // ---------------------------------------------------------------------------------------------

    // Creates the |houseVehicle| associated with the |location|. The |immediate| flag may be used
    // to force creation of the vehicle on the server, which will make it available instantly.
    createVehicle(location, houseVehicle, immediate = false) {
        if (!this.locationVehicles_.has(location))
            this.locationVehicles_.set(location, new Set());

        const parkingLot = houseVehicle.parkingLot;
        const streamableVehicleInfo = new StreamableVehicleInfo({
            modelId: houseVehicle.modelId,

            position: parkingLot.position,
            rotation: parkingLot.rotation,

            // Give the house's vehicle a number plate named after the owner when known.
            numberPlate: location.settings?.ownerName ?? null,

            // Pass through the optional settings for the vehicle, only set when available.
            primaryColor: houseVehicle.primaryColor,
            secondaryColor: houseVehicle.secondaryColor,
            paintjob: houseVehicle.paintjob,
            components: houseVehicle.components,

            // House vehicles are considered persistent vehicles, so set a `respawnDelay`.
            respawnDelay: this.settings_().getValue('vehicles/respawn_persistent_delay_sec'),
        });

        const streamableVehicle = this.streamer_().createVehicle(streamableVehicleInfo, immediate);

        this.locationVehicles_.get(location).add(houseVehicle);
        this.streamableVehicles_.set(houseVehicle, streamableVehicle);

        return streamableVehicle;
    }

    // Finds the location and parking lot associated with the |vehicle|, if any. When found, the
    // result will be returned as an object structured like { location, houseVehicle }.
    findLocationForVehicle(vehicle) {
        for (const [ location, houseVehicles ] of this.locationVehicles_) {
            for (const houseVehicle of houseVehicles) {
                const streamableVehicle = this.streamableVehicles_.get(houseVehicle);
                if (!streamableVehicle || !streamableVehicle.live)
                    continue;  // the |streamableVehicle| has not been created yet

                if (streamableVehicle.live === vehicle)
                    return { location, houseVehicle };
            }
        }

        return null;
    }

    // Returns the streamable vehicle for the given |houseVehicle|.
    getStreamableVehicle(houseVehicle) { return this.streamableVehicles_.get(houseVehicle); }

    // Removes the |houseVehicle| that used to be associated with the |location|.
    removeVehicle(location, houseVehicle) {
        const houseVehicles = this.locationVehicles_.get(location);
        if (!houseVehicles)
            throw new Error('Invalid |location| passed while removing a house vehicle.');

        if (!houseVehicles.has(houseVehicle))
            throw new Error('The |houseVehicle| is not associated with the |location|.');

        const streamableVehicle = this.streamableVehicles_.get(houseVehicle);
        if (!streamableVehicle)
            throw new Error('Invalid |houseVehicle| passed while removing a house vehicle.');

        this.streamableVehicles_.delete(houseVehicle);
        this.streamer_().deleteVehicle(streamableVehicle);

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
            const streamableVehicle = this.streamableVehicles_.get(houseVehicle);
            if (!streamableVehicle)
                throw new Error('No streamable vehicle for the given |houseVehicle|.');

            this.streamableVehicles_.delete(houseVehicle);
            this.streamer_().deleteVehicle(streamableVehicle);
        }

        this.locationVehicles_.delete(location);
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the streamer has been reloaded, in which case we need to reattach all the known
    // vehicles associated with houses. Achieve this by creating them all from scratch.
    onStreamerReloaded() {
        const existingVehicles = new Map(this.locationVehicles_);

        this.locationVehicles_.clear();
        this.streamableVehicles_.clear();

        for (const [ location, houseVehicles ] of existingVehicles) {
            for (const houseVehicle of houseVehicles)
                this.createVehicle(location, houseVehicle);
        }
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.streamer_.removeReloadObserver(this);

        this.locationVehicles_.clear();
        this.locationVehicles_ = null;

        for (const streamableVehicle of this.streamableVehicles_.values())
            this.streamer_().deleteVehicle(streamableVehicle);

        this.streamableVehicles_.clear();
        this.streamableVehicles_ = null;
    }
}
