// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Wraps the PlaygroundJS-provided Streamer object and keeps it up-to-date with the necessary meta-
// information. Deliberately has very little logic of its own.
export class VehicleStreamer {
    streamer_ = null;

    entities_ = null;
    vehicles_ = null;

    constructor(settings) {
        const maxDistance = settings().getValue('vehicles/streamer_max_distance');
        const maxVisible = settings().getValue('vehicles/streamer_max_visible');

        this.streamer_ = new Streamer(maxVisible, maxDistance);

        this.entities_ = new Map();
        this.vehicles_ = new Map();

        this.updateTrackedPlayers();

        server.playerManager.addObserver(this);
    }

    // ---------------------------------------------------------------------------------------------

    // Adds the given |vehicle| to the streamer. Bookkeeping will be done internally to avoid
    // leaking entity Ids to other parts of the system.
    add(vehicle) {
        const entityId = this.streamer_.add(
            vehicle.position.x, vehicle.position.y, vehicle.position.z);
        
        this.entities_.set(vehicle, entityId);
        this.vehicles_.set(entityId, vehicle);
    }

    // Removes the given |vehicle| from the streamer.
    delete(vehicle) {
        if (!this.entities_.has(vehicle)) {
            console.log(`[streamer][exception] Deleting invalid vehicle from streamer: ${vehicle}`);
            return;
        }

        const entityId = this.entities_.get(vehicle);

        this.streamer_.delete(entityId);

        this.entities_.delete(vehicle);
        this.vehicles_.delete(entityId);
    }

    // Optimises the vehicle RTree by recreating it. Should be done sparsely, only after significant
    // mutations in the available vehicles have been made.
    optimise() { this.streamer_.optimise(); }

    // Gets the number of vehicles that have been created on the streamer.
    get size() { return this.entities_.size; }

    // ---------------------------------------------------------------------------------------------

    // Streams the vehicles that should be visible right now. Returns a Set instance with all the
    // StreamableVehicle instances that should be created on the server.
    async stream() {
        const results = await this.streamer_.stream();
        const vehicles = new Set();

        if (results && Array.isArray(results)) {
            for (const entityId of results) {
                const vehicle = this.vehicles_.get(entityId);
                if (!vehicle) {
                    console.log('vehicle not found');
                    continue;  // presumed race condition
                }
                
                vehicles.add(vehicle);
            }
        }

        return vehicles;
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the given |player| has connected to the server.
    onPlayerConnect(player) {
        if (!player.isNonPlayerCharacter())
            this.updateTrackedPlayers();
    }

    // Called when the given |player| has disconnected from the server.
    onPlayerDisconnect(player) {
        if (!player.isNonPlayerCharacter())
            this.updateTrackedPlayers();
    }

    // Updates the set of players that should be tracked by the streamer. It will automatically get
    // their position information at a particular cadence.
    updateTrackedPlayers() {
        const players = new Set();

        for (const player of server.playerManager) {
            if (player.isNonPlayerCharacter())
                continue;
            
            players.add(player.id);
        }

        Streamer.setTrackedPlayers(players);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.playerManager.removeObserver(this);

        // The |Streamer| instance will be garbage collected, which will automatically remove all
        // stored instance data from the server. Even if that fails, we're talking ~100KiB here.
        this.streamer_ = null;

        this.entities_.clear();
        this.entities_ = null;

        this.vehicles_.clear();
        this.vehicles_ = null;
    }
}
