// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ScopedCallbacks = require('base/scoped_callbacks.js');

// Range, in units, that enter and exit keys will work around a remote controllable vehicle.
const RemoteControllableVehicleRange = 2;

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
        this.rcVehicles_ = new Set();

        this.callbacks_ = new ScopedCallbacks();
        this.callbacks_.addEventListener(
            'vehiclespawn', VehicleManager.prototype.onVehicleSpawn.bind(this));
        this.callbacks_.addEventListener(
            'vehicledeath', VehicleManager.prototype.onVehicleDeath.bind(this));

        // TODO(Russell): Handle OnVehicleDamangeStatusUpdate
        // TODO(Russell): Handle OnVehicleMod
        // TODO(Russell): Handle OnVehiclePaintjob
        // TODO(Russell): Handle OnVehicleRespray
        // TODO(Russell): Handle OnVehicleSirenStateChange

        this.processTrailerUpdates();
    }

    // Gets the number of vehicles currently created on the server.
    get count() { return this.vehicles_.size; }

    // Gets the number of remote controllable vehicles currently created on the server.
    get remoteControllableCount() { return this.rcVehicles_.size; }

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
                    siren = false, paintjob = null, respawnDelay = 180 /* seconds */,
                    interiorId = 0, virtualWorld = 0 } = {}) {
        const vehicle = new this.vehicleConstructor_(this, {
            modelId, position, rotation, primaryColor, secondaryColor, siren, paintjob,
            respawnDelay, interiorId, virtualWorld
        });

        this.vehicles_.set(vehicle.id, vehicle);

        if (vehicle.model.isRemoteControllable())
            this.rcVehicles_.add(vehicle);

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

    // ---------------------------------------------------------------------------------------------

    // Called by the Player Manager when the player potentially requests to enter or exit their
    // vehicle. Applies the special processing needed in order to support RC Vehicles.
    onPlayerVehicleEnterExit(player) {
        const currentVehicle = player.vehicle;

        if (currentVehicle) {
            if (!currentVehicle.model.isRemoteControllable())
                return;  // the |player| is driving a vehicle, but it's not a RC vehicle.

            player.leaveVehicle();
            return;
        }

        const squaredMaximum = RemoteControllableVehicleRange * RemoteControllableVehicleRange;
        const position = player.position;

        const nearbyVehicles = [];

        for (const vehicle of this.rcVehicles_) {
            const squaredDistance = position.squaredDistanceTo(vehicle.position);
            if (squaredDistance > squaredMaximum)
                continue;  // the vehicle is out of range

            if (vehicle.isLockedForPlayer(player))
                continue;  // they do not have access to the vehicle

            nearbyVehicles.push({ vehicle, squaredDistance });
        }

        if (!nearbyVehicles.length)
            return;  // there are no remote controllable vehicles near the |player|

        // Sort the |nearbyVehicles| so that we select the vehicle closest to the |player|.
        nearbyVehicles.sort((lhs, rhs) => {
            if (lhs.squaredDistance === rhs.squaredDistance)
                return 0;

            return lhs.squaredDistance > rhs.squaredDistance ? 1 : -1;
        });

        const { vehicle } = nearbyVehicles[0];

        // Eject the vehicle's current driver, if there is one.
        if (vehicle.driver)
            vehicle.driver.leaveVehicle();

        // Make the |player| enter the vehicle by teleporting them in.
        player.enterVehicle(vehicle, Vehicle.SEAT_DRIVER);
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

        if (vehicle.model.isRemoteControllable())
            this.rcVehicles_.delete(vehicle);

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

exports = VehicleManager;
