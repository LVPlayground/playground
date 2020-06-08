// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Mocked implementation of the vehicle streamer that does not rely on the Streamer API made
// available through the PlaygroundJS plugin. Appropriate for testing.
export class MockVehicleStreamer {
    maxDistance_ = null;
    maxVisible_ = null;

    players_ = null;
    vehicles_ = null;

    constructor(settings) {
        this.maxDistance_ = settings().getValue('vehicles/streamer_max_distance');
        this.maxVisible_ = settings().getValue('vehicles/streamer_max_visible');

        this.players_ = new Set();
        this.vehicles_ = new Set();
    }

    // ---------------------------------------------------------------------------------------------

    // Sets the |players| as the tracked players for testing purposes.
    setPlayersForTesting(players) {
        this.players_ = new Set([ ...players ]);
    }

    // ---------------------------------------------------------------------------------------------

    add(vehicle) { this.vehicles_.add(vehicle);  }
    delete(vehicle) { this.vehicles_.delete(vehicle); }

    optimise() {}

    get size() { return this.vehicles_.size; }

    // ---------------------------------------------------------------------------------------------

    async stream() {
        const vehicles = new Set();

        for (const player of this.players_) {
            const playerVehicles = new Set();
            const share = this.maxVisible_ / this.players_.size;

            for (const vehicle of this.vehicles_) {
                const squaredDistance = vehicle.position.squaredDistanceTo2D(player.position);
                if (squaredDistance > this.maxDistance_ * this.maxDistance_)
                    continue;

                playerVehicles.add(vehicle);
                vehicles.add(vehicle);

                if (playerVehicles.size > share)
                    break;
            }
        }

        return [ ...vehicles ];
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.players_.clear();
        this.players_ = null;

        this.vehicles_.clear();
        this.vehicles_ = null;
    }
}
