// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Feature from 'components/feature_manager/feature.js';
import { MockVehicleStreamer } from 'features/streamer/test/mock_vehicle_streamer.js';
import { VehicleRegistry } from 'features/streamer/vehicle_registry.js';
import { VehicleSelectionManager } from 'features/streamer/vehicle_selection_manager.js';
import { VehicleStreamer } from 'features/streamer/vehicle_streamer.js';

// Determines whether the given |object| is a of the given |name|. Used because the Streamer feature
// is eligible for live reload, which means that there might be alternative objects around.
function isInstance(object, name) {
    return typeof object === 'object' && object.constructor && object.constructor.name === name;
}

// Enhances Las Venturas Playground with the ability to exceed the default vehicle limits. All
// vehicles part of freeroam, houses and similar features should be created through the streamer.
export default class Streamer extends Feature {
    registry_ = null;
    selectionManager_ = null;
    streamer_ = null;

    constructor() {
        super();

        // Depends on settings to configure the properties of vehicle streaming on the server.
        const settings = this.defineDependency('settings');

        // The streamer wraps the PlaygroundJS-provided streaming plane, and makes sure that its
        // information continues to be up-to-date.
        this.streamer_ = server.isTest() ? new MockVehicleStreamer(settings)
                                         : new VehicleStreamer(settings);

        // Keeps track of which streamable vehicles have been created on the server.
        this.registry_ = new VehicleRegistry(settings, this.streamer_);

        // Responsible for taking information from the vehicle streamer, and ensuring that those
        // vehicles are created on the server. The meaty bit of our streamer.
        this.selectionManager_ = new VehicleSelectionManager(
            this.registry_, settings, this.streamer_);
        
        if (!server.isTest())
            this.selectionManager_.select();
    }

    // ---------------------------------------------------------------------------------------------
    // Public API of the Streamer feature
    // ---------------------------------------------------------------------------------------------

    // Creates a new streamable vehicle on the server. The |vehicle| must thus follow the syntax of
    // the StreamableVehicleInfo object. An instance of StreamableVehicle will be returned. Vehicles
    // without a `respawnDelay` setting will be considered ephemeral.
    createVehicle(vehicleInfo, immediate = false) {
        if (!isInstance(vehicleInfo, 'StreamableVehicleInfo'))
            throw new Error(`The vehicle info must be given as a StreamableVehicleInfo instance.`);
        
        const streamableVehicle = this.registry_.createVehicle(vehicleInfo);
        if (immediate)
            this.selectionManager_.requestCreateVehicle(streamableVehicle);

        return streamableVehicle;
    }

    // Deletes the given |vehicle| from the server, which must be a StreamableVehicle instance.
    // Ephemeral vehicles may be
    deleteVehicle(vehicle) {
        if (!isInstance(vehicle, 'StreamableVehicle'))
            throw new Error(`The vehicle must be given as a StreamableVehicle instance.`);
        
        this.registry_.deleteVehicle(vehicle);

        // Request deletion of any live representations of this vehicle as well.
        this.selectionManager_.requestDeleteVehicle(vehicle);
    }

    // ---------------------------------------------------------------------------------------------

    // Requests the streamer plane to be optimised. Technically, this will re-insert all vehicles in
    // the RTree which allows for them to be better balanaced.
    optimise() { this.streamer_.optimise(); }

    // Queries the streaming radius around the given |position| to understand the number of vehicles
    // and vehicle models that exist in that area.
    query(position) { return this.registry_.query(position); }

    // Gets statistics about the vehicle streamer, to understand how it's performing and what's
    // been created on the server. Useful to understand whether the streamer is working well.
    stats() {
        return {
            // Total number of vehicles known to the streamer.
            totalVehicles: this.streamer_.size,

            // Total number of vehicles that have been created on the server.
            liveVehicles: this.selectionManager_.liveVehicles,

            // Total number of vehicles that have been streamed in.
            streamedVehicles: this.selectionManager_.streamedVehicles,
            
            // Total number of vehicles that have been cached.
            cachedVehicles: this.selectionManager_.cachedVehicles,

            // Total number of vehicles that are currently on the respawn queue.
            respawnQueueVehicles: this.selectionManager_.respawnQueueVehicles,
        }
    }

    // ---------------------------------------------------------------------------------------------
    // Public API intended for testing purposes of the Streamer feature
    // ---------------------------------------------------------------------------------------------

    // Gets the number of vehicles that exist on the streamer. Should only be used for testing.
    get sizeForTesting() { return this.streamer_.size; }

    // Streams all created vehicles, triggering creation and disposal of the real vehicles based on
    // the positions of the given |players|, which must be an iterable of Player instances.
    async streamForTesting(players) {
        if (!server.isTest())
            throw new Error(`The streamForTesting() method is only available during tests.`);

        this.streamer_.setPlayersForTesting(players);
        this.selectionManager_.updateSelection(new Set([ ...await this.streamer_.stream() ]));
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.registry_.dispose();
        this.registry_ = null;

        this.streamer_.dispose();
        this.streamer_ = null;

        this.selectionManager_.dispose();
        this.selectionManager_ = null;
    }
}
