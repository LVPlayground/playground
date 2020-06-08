// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { StreamableVehicleInfo } from 'features/streamer/streamable_vehicle_info.js';
import { StreamableVehicle } from 'features/streamer/streamable_vehicle.js';
import { Vector } from 'base/vector.js';
import { VehicleStreamer } from 'features/streamer/vehicle_streamer.js';

import { random } from 'base/random.js';

describe('VehicleStreamer', (it, beforeEach, afterEach) => {
    let streamer = null;

    beforeEach(() => {
        const settings = server.featureManager.loadFeature('settings');

        streamer = new VehicleStreamer(() => settings);
    });

    afterEach(() => streamer.dispose());

    it('should be able to add, count, stream and delete vehicles', async(assert) => {
        assert.equal(streamer.size, 0);

        // Fake connection of three players.
        Streamer.setTrackedPlayers(new Set([ 0, 1, 2 ]));

        const vehicles = new Set();
        for (let vehicleId = 0; vehicleId < 10; ++vehicleId) {
            const vehicleInfo = new StreamableVehicleInfo({
                modelId: 411,  // infernus
                position: new Vector(random(-3000, 3000), random(-3000, 3000), 10),
                rotation: 180
            });

            const vehicle = new StreamableVehicle(vehicleInfo);

            vehicles.add(vehicle);
            streamer.add(vehicle);
        }
        
        assert.equal(streamer.size, 10);

        // Request the streamer to be optimised. This does not signal back to JavaScript, but will
        // exercise the code path in the plugin.
        streamer.optimise();

        // Request a full stream. This won't yield any results, but does do a round-trip to the
        // background thread in the plugin, and exercises more code.
        await streamer.stream();

        for (const vehicle of vehicles)
            streamer.delete(vehicle);
        
        assert.equal(streamer.size, 0);

        // Remove the tracked players again, to clean up our state.
        Streamer.setTrackedPlayers(new Set());
    });
});
