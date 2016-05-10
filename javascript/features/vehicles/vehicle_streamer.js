// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const VehicleGrid = require('features/vehicles/vehicle_grid.js');

// The default streaming distance for vehicles.
const DefaultStreamDistance = 300;

// The maximum number of vehicles that the streamer will create at any one time.
const DefaultVehicleLimit = 1000;

// The vehicle streamer is responsible for making sure that sufficient vehicles have been created
// around players to give everyone the feeling that there are plenty of them available. It does
// this by maintaining a grid of the original vehicle locations, so that the nearest vehicles to
// each players can quickly and accurately be determined.
class VehicleStreamer {
    constructor() {
        this.grid_ = new VehicleGrid(DefaultStreamDistance);
        this.initialized_ = false;

        // Persistent vehicles will always exist and bypass the grid streamer.
        this.persistentVehicles_ = new Set();
    }

    // Gets the number of persistent vehicles in the game.
    get persistentVehicleCount() { return this.persistentVehicles_.size; }

    // Gets the number of streamed vehicles in the game.
    get streamedVehicleCount() { return this.grid_.size; }

    // Returns whether the streamer has been initialized for streaming use.
    isInitialized() { return this.initialized_; }

    // Adds the |storedVehicle| to the vehicle streamer. The state for players will only be
    // recomputed if the streamer has been initialized already.
    addVehicle(storedVehicle) {
        if (storedVehicle.isPersistent()) {
            this.persistentVehicles_.add(storedVehicle);
            if (!this.initialized_)
                return;  // the loader will initialize the streamer afterwards

            // TODO(Russell): Create the actual vehicle associated with |storedVehicle|.

        } else {
            this.grid_.addVehicle(storedVehicle);
            if (!this.initialized_)
                return;  // the loader will initialize the streamer afterwards

            // TODO(Russell): How to property refcount players for whom the |storedVehicle| is
            //                being kept alive?
        }
    }

    // Removes the |storedVehicle| from the vehicle streamer.
    removeVehicle(storedVehicle) {
        if (!this.initialized_)
            throw new Error('Vehicles may not be removed before the initial initialization.');

        if (storedVehicle.isPersistent()) {
            this.persistentVehicles_.delete(storedVehicle);

            // TODO(Russell): Destroy the actual vehicle associated with |storedVehicle|.

        } else {
            this.grid_.removeVehicle(storedVehicle);

            // TODO(Russell): Release refcounts on the |storedVehicle| and remove it from the game.
        }
    }

    // Initializes the streamer. This must be called after the initial vehicle import to make sure
    // that the right vehicles have been created, and have been associated with the right players.
    initialize() {
        // TODO(Russell): Create all persistent vehicles.
        // TODO(Russell): Run a full stream for all connected players and create the necessary
        //                vehicles. NPCs should of course be excluded from this.

        this.initialized_ = true;
    }

    dispose() {
        this.grid_.dispose();

        this.persistentVehicles_ = null;
        this.grid_ = null;
    }
}

exports = VehicleStreamer;
