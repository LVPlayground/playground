// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const PriorityQueue = require('base/priority_queue.js');
const VehicleGrid = require('features/vehicles/vehicle_grid.js');

// The default streaming distance for vehicles.
const DefaultStreamDistance = 300;

// The maximum number of vehicles that the streamer will create at any one time.
const DefaultVehicleLimit = 1000;

// The number of closest vehicle to each player that should be attempted to be spawned.
const DefaultVehiclesPerPlayer = 20;

// The vehicle streamer is responsible for making sure that sufficient vehicles have been created
// around players to give everyone the feeling that there are plenty of them available. It does
// this by maintaining a grid of the original vehicle locations, so that the nearest vehicles to
// each players can quickly and accurately be determined.
class VehicleStreamer {
    constructor(vehicleConstructor = Vehicle) {
        this.grid_ = new VehicleGrid(DefaultStreamDistance);
        this.initialized_ = false;

        // The constructor that will be used for creating vehicles.
        this.vehicleConstructor_ = vehicleConstructor;

        // Persistent vehicles will always exist and bypass the grid streamer.
        this.persistentVehicles_ = new Set();

        // Mapping of players to the set of vehicles that are referenced by them.
        this.playerReferences_ = new Map();

        // A prioritized queue containing the streamable vehicles that aren't being kept alive for
        // any of the players, but are being kept alive to reduce vehicle churn.
        this.disposableVehicles_ = new PriorityQueue(VehicleStreamer.totalRefCountComparator);
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

            this.internalCreateVehicle(storedVehicle);

        } else {
            this.grid_.addVehicle(storedVehicle);
            if (!this.initialized_)
                return;  // the loader will initialize the streamer afterwards

            const squaredStreamDistance = this.grid_.streamDistance * this.grid_.streamDistance;
            const storedVehiclePosition = storedVehicle.position;

            server.playerManager.forEach(player => {
                if (!this.playerReferences_.has(player))
                    return;  // the player has not been considered for vehicle streaming

                const distance = storedVehiclePosition.squaredDistanceTo2D(player.position);
                if (distance > squaredStreamDistance)
                    return;  // the vehicle is out of range for the player

                // Reference the vehicle from the player's vehicle set.
                this.playerReferences_.get(player).add(storedVehicle);

                // Increase the reference count on the vehicle itself.
                storedVehicle.increaseRefCount();
            });
        }
    }

    // Removes the |storedVehicle| from the vehicle streamer.
    removeVehicle(storedVehicle) {
        if (!this.initialized_)
            throw new Error('Vehicles may not be removed before the initial initialization.');

        if (storedVehicle.isPersistent()) {
            this.persistentVehicles_.delete(storedVehicle);
            this.internalDestroyVehicle(storedVehicle);

        } else {
            this.grid_.removeVehicle(storedVehicle);
            this.internalDestroyVehicle(storedVehicle);

            for (let [player, references] of this.playerReferences_) {
                if (references.delete(storedVehicle))
                    storedVehicle.decreaseRefCount();
            }

            if (storedVehicle.refCount != 0)
                throw new Error('The vehicle has stray references after processing all players.');
        }
    }

    // Initializes the streamer. This must be called after the initial vehicle import to make sure
    // that the right vehicles have been created, and have been associated with the right players.
    initialize() {
        if (this.initialized_)
            throw new Error('The vehicle streamer cannot be initialized multiple times.');

        for (let storedVehicle of this.persistentVehicles_)
            this.internalCreateVehicle(storedVehicle);

        // The number of vehicles to create depends on the regular vehicles-per-player limit, as
        // well as on the total number of in-game players 
        let maximumVehiclesPerPlayer = DefaultVehiclesPerPlayer;
        if (server.playerManager.count > 0) {
            const vehicleLimit = DefaultVehicleLimit - this.persistentVehicleCount;

            maximumVehiclesPerPlayer =
                Math.min(maximumVehiclesPerPlayer, vehicleLimit / server.playerManager.count);
        }

        // Synchronously initialize vehicles for all in-game players.
        server.playerManager.forEach(player =>
            this.streamForPlayer(player, maximumVehiclesPerPlayer));

        this.initialized_ = true;
    }

    // Synchronously streams the vehicles for |player|. The |vehicleCount| indicates the number of
    // vehicles that should be attempted to be created for the player.
    streamForPlayer(player, vehicleCount = DefaultVehiclesPerPlayer) {
        if (!this.playerReferences_.has(player))
            this.playerReferences_.set(player, new Set());

        // TODO(Russell): Implement the streaming routines.
    }

    // Actually creates the vehicle associated with |storedVehicle| and returns the |vehicle|
    // instance it's now associated with. The instance will be set on the |storedVehicle| as well.
    internalCreateVehicle(storedVehicle) {
        if (storedVehicle.vehicle)
            return;  // the vehicle has already been created

        const vehicle = new this.vehicleConstructor_({
            modelId: storedVehicle.modelId,
            position: storedVehicle.position,
            rotation: storedVehicle.rotation,
            colors: [ storedVehicle.primaryColor, storedVehicle.secondaryColor ],
            paintjob: storedVehicle.paintjob,
            interiorId: storedVehicle.interiorId
        });

        storedVehicle.vehicle = vehicle;
        return vehicle;
    }

    // Removes the vehicle associated with the |storedVehicle| from the server.
    internalDestroyVehicle(storedVehicle) {
        if (!storedVehicle.vehicle)
            return;  // the vehicle does not exist on the server anymore

        storedVehicle.vehicle.dispose();
        storedVehicle.vehicle = null;
    }

    dispose() {
        this.grid_.dispose();

        this.persistentVehicles_ = null;
        this.grid_ = null;
    }

    // Comparator for ordering the list of disposable vehicles by total number of references in
    // ascending order. The top of the list contains vehicles most appropriate to remove.
    static totalRefCountComparator(lhs, rhs) {
        if (lhs.totalRefCount === rhs.totalRefCount)
            return 0;

        return lhs.totalRefCount > rhs.totalRefCount ? 1 : -1;
    }
}

exports = VehicleStreamer;
