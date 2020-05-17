// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import ScopedCallbacks from 'base/scoped_callbacks.js';

// Number of milliseconds before running a trailer status update.
const TrailerStatusUpdateTimeMs = 1250;

// The vehicle manager is in control of all vehicles that have been created by the JavaScript code
// of Las Venturas Playground. It deliberately does not provide access to the Pawn vehicles.
class VehicleManager {
    constructor(vehicleConstructor = Vehicle) {
        this.vehicleConstructor_ = vehicleConstructor;
        this.disposed_ = false;

        this.observers_ = new Set();

        this.vehicles_ = new Map();

        this.callbacks_ = new ScopedCallbacks();
        this.callbacks_.addEventListener(
            'vehiclespawn', VehicleManager.prototype.onVehicleSpawn.bind(this));
        this.callbacks_.addEventListener(
            'vehicledeath', VehicleManager.prototype.onVehicleDeath.bind(this));

        // TODO(Russell): Handle OnVehicleDamangeStatusUpdate

        this.callbacks_.addEventListener(
            'vehiclemod', VehicleManager.prototype.onVehicleMod.bind(this)); 
        this.callbacks_.addEventListener(
            'vehiclepaintjob', VehicleManager.prototype.onVehiclePaintjob.bind(this)); 
        this.callbacks_.addEventListener(
            'vehiclerespray', VehicleManager.prototype.onVehicleRespray.bind(this)); 

        // TODO(Russell): Handle OnVehicleSirenStateChange

        this.processTrailerUpdates();
    }

    // Gets the number of vehicles currently created on the server.
    get count() { return this.vehicles_.size; }

    // ---------------------------------------------------------------------------------------------

    // Returns the vehicle identified by |vehicleId|, or NULL when the vehicle does not exist or
    // is not owned by the JavaScript code.
    getById(vehicleId) {
        if (this.vehicles_.has(vehicleId))
            return this.vehicles_.get(vehicleId);

        return null;
    }

    // Executes the |callback| once for each vehicle that exists on Las Venturas Playground.
    forEach(callback, thisArg = null) {
        this.vehicles_.forEach(callback);
    }

    // ---------------------------------------------------------------------------------------------

    // Observes events for the vehicles owned by this manager. |observer| can be added multiple
    // times, but will receive events only once.
    addObserver(observer) {
        this.observers_.add(observer);
    }

    // Removes |observer| from the set of objects that will be informed about vehicle events.
    removeObserver(observer) {
        this.observers_.delete(observer);
    }

    // ---------------------------------------------------------------------------------------------

    // Creates a new vehicle with the given options. The vehicle's model Id and position are
    // required, all other options can optionally be provided.
    createVehicle({ modelId, position, rotation = 0, primaryColor = -1, secondaryColor = -1,
                    siren = false, paintjob = null, numberPlate = null, respawnDelay = 180,
                    interiorId = 0, virtualWorld = 0 } = {}) {
        const vehicle = new this.vehicleConstructor_(this, {
            modelId, position, rotation, primaryColor, secondaryColor, siren, paintjob, numberPlate,
            respawnDelay, interiorId, virtualWorld
        });

        this.vehicles_.set(vehicle.id, vehicle);
        return vehicle;
    }

    // ---------------------------------------------------------------------------------------------

    // Called when a vehicle has spawned on the server. Observers will be informed about this event.
    onVehicleSpawn(event) {
        const vehicle = this.vehicles_.get(event.vehicleid);
        if (!vehicle)
            return;  // the vehicle isn't owned by the JavaScript code

        if (vehicle.trailer)
            this.detachTrailer(vehicle);

        this.notifyObservers('onVehicleSpawn', vehicle);
    }

    // Called when a vehicle on the server either has exploded or has hit the water. Observers will
    // be informed about this event, but we ignore the misleading `killerid` parameter.
    onVehicleDeath(event) {
        const vehicle = this.vehicles_.get(event.vehicleid);
        if (!vehicle)
            return;  // the vehicle isn't owned by the JavaScript code

        this.notifyObservers('onVehicleDeath', vehicle);
    }

    // Called when a vehicle has streamed in for a particular player. The vehicle needs to be re-
    // locked if a lock was in place for the particular player.
    onVehicleStreamIn(event) {
        const player = server.playerManager.getById(event.forplayerid);
        const vehicle = this.vehicles_.get(event.vehicleid);

        if (!player || !vehicle)
            return;  // either the player or the vehicle are not recognized

        if (vehicle.isLockedForPlayer(player))
            vehicle.lockForPlayer(player);
    }

    // ---------------------------------------------------------------------------------------------

    onVehicleMod(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player)
            return;

        const vehicle = this.vehicles_.get(event.vehicleid);
        if (!vehicle)
            return;

        this.notifyObservers('onVehicleMod', player, vehicle, event.componentid);
    }

    onVehiclePaintjob(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player)
            return;

        const vehicle = this.vehicles_.get(event.vehicleid);
        if (!vehicle)
            return;
        
        this.notifyObservers('onVehiclePaintjob', player, vehicle, event.paintjobid);
    }

    onVehicleRespray(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player)
            return;

        const vehicle = this.vehicles_.get(event.vehicleid);
        if (!vehicle)
            return;

        this.notifyObservers('onVehicleRespray', player, vehicle, event.color1, event.color2);
    }

    // ---------------------------------------------------------------------------------------------

    // Iterates over all live vehicles to determine whether they've got a trailer. When they do,
    // mark the relationship between the vehicles.
    async processTrailerUpdates() {
        while (!this.disposed_) {
            for (const vehicle of this.vehicles_.values()) {
                const trailer = this.vehicles_.get(vehicle.findTrailerId()) || null;
                if (trailer === vehicle.trailer)
                    continue;

                if (vehicle.trailer)
                    this.detachTrailer(vehicle);

                if (trailer)
                    this.attachTrailer(vehicle, trailer);
            }

            await milliseconds(TrailerStatusUpdateTimeMs);
        }
    }

    // To be called by vehicles when Vehicle.attach() is called.
    attachTrailer(vehicle, trailer) {
        vehicle.trailer = trailer;
        vehicle.trailer.parent = vehicle;

        this.notifyObservers('onTrailerAttached', vehicle, trailer);
    }

    // To be called by vehicles when Vehicle.detach() is called.
    detachTrailer(vehicle) {
        const formerTrailer = vehicle.trailer;

        vehicle.trailer.parent = null;
        vehicle.trailer = null;

        if (formerTrailer.isConnected())
            this.notifyObservers('onTrailerDetached', vehicle, formerTrailer);
    }

    // ---------------------------------------------------------------------------------------------

    // Notifies observers about the |eventName|, passing |...args| as the argument to the method
    // when it exists. The call will be bound to the observer's instance.
    notifyObservers(eventName, ...args) {
        for (const observer of this.observers_) {
            if (observer.__proto__.hasOwnProperty(eventName))
                observer.__proto__[eventName].call(observer, ...args);
            else if (observer.hasOwnProperty(eventName))
                observer[eventName].call(observer, ...args);
        }
    }

    // Called when |vehicle| has been disposed. The reference to the vehicle will be released from
    // the vehicle manager, which means that it will be inaccessible from here on out.
    didDisposeVehicle(vehicle) {
        if (!this.vehicles_.has(vehicle.id))
            throw new Error('The vehicle with Id #' + vehicle.id + ' is not known to the manager.');

        if (vehicle.trailer) {
            vehicle.trailer.parent = null;
            vehicle.trailer = null;
        }

        this.vehicles_.delete(vehicle.id);
    }

    // Releases all references and state held by the vehicle manager.
    dispose() {
        this.disposed_ = true;

        this.callbacks_.dispose();
        this.callbacks_ = null;

        // Forcefully dispose all vehicles created through JavaScript on the server.
        this.vehicles_.forEach(vehicle => vehicle.dispose());

        if (this.vehicles_.size > 0)
            throw new Error('There are vehicles left in the vehicle manager after disposing it.');

        this.vehicles_ = null;
        this.observers_ = null;
    }
}

export default VehicleManager;
