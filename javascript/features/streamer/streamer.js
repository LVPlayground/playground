// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Feature from 'components/feature_manager/feature.js';
import { MockVehicleStreamer } from 'features/streamer/test/mock_vehicle_streamer.js';
import { StreamableVehicleInfo } from 'features/streamer/streamable_vehicle_info.js';
import { StreamableVehicle } from 'features/streamer/streamable_vehicle.js';
import { VehicleRegistry } from 'features/streamer/vehicle_registry.js';
import { VehicleSelectionManager } from 'features/streamer/vehicle_selection_manager.js';
import { VehicleStreamer } from 'features/streamer/vehicle_streamer.js';

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
        this.registry_ = new VehicleRegistry(this.streamer_);

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
    createVehicle(vehicleInfo) {
        if (!(vehicleInfo instanceof StreamableVehicleInfo))
            throw new Error(`The vehicle info must be given as a StreamableVehicleInfo instance.`);
        
        return this.registry_.createVehicle(vehicleInfo);
    }

    // Requests the streamer plane to be optimised. Technically, this will re-insert all vehicles in
    // the RTree which allows for them to be better balanaced.
    optimise() { this.streamer_.optimise(); }

    // Deletes the given |vehicle| from the server, which must be a StreamableVehicle instance.
    // Ephemeral vehicles may be
    deleteVehicle(vehicle) {
        if (!(vehicle instanceof StreamableVehicle))
            throw new Error(`The vehicle must be given as a StreamableVehicle instance.`);
        
        this.registry_.deleteVehicle(vehicle);
    }

    // ---------------------------------------------------------------------------------------------
    // Public API intended for testing purposes of the Streamer feature
    // ---------------------------------------------------------------------------------------------

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
