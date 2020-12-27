// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { ScopedCallbacks } from 'base/scoped_callbacks.js';

import { canVehicleModelHaveComponent } from 'entities/vehicle_components.js';

// The vehicle manager is in control of all vehicles that have been created by the JavaScript code
// of Las Venturas Playground. It deliberately does not provide access to the Pawn vehicles.
export class VehicleManager {
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

        provideNative(
            'ReportTrailerUpdate', 'ii', VehicleManager.prototype.reportTrailerUpdate.bind(this));
    }

    // Gets the number of vehicles currently created on the server.
    get count() { return this.vehicles_.size; }
    get size() { return this.vehicles_.size; }

    // Returns an iterator that can be used to iterate over the created vehicles.
    [Symbol.iterator]() { return this.vehicles_.values(); }

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
                    siren = false, paintjob = null, numberPlate = null, components = [],
                    respawnDelay = 180, interiorId = 0, virtualWorld = 0 } = {}) {
                    
        const vehicle = new this.vehicleConstructor_(this);

        vehicle.initialize({
            modelId, position, rotation, primaryColor, secondaryColor, siren, paintjob, numberPlate,
            components, respawnDelay, interiorId, virtualWorld
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

        // Resets vehicle properties when it respawns, such as colours, paint jobs and components.
        vehicle.initializeOnSpawn();

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

    // Called when a vehicle is being modified by a particular player. This event is cancelable, and
    // should be canceled when an illegal modification is being made. This is a tactic that players
    // with malicious intent often use for crashing others.
    onVehicleMod(event) {
        const player = server.playerManager.getById(event.playerid);
        const vehicle = this.vehicles_.get(event.vehicleid);

        // If either the |player| or the |vehicle| is invalid, bail out and prevent the default
        // processing from happening. We don't have enough information to blame a cheater.
        if (!player || !vehicle) {
            console.log(`[exception] Vehicle modification found with invalid player/vehicle.`);

            event.preventDefault();
            return;
        }

        const componentId = event.componentid;

        // If the |vehicle| is not allowed to have the |componentId|, we cancel the event, notify
        // observers of an illegal vehicle modification, and bail out.
        if (!canVehicleModelHaveComponent(vehicle.modelId, componentId)) {
            this.notifyObservers('onVehicleIllegalModification', player, vehicle, componentId);

            event.preventDefault();
            return;
        }

        // Register the |componentId| with the |vehicle|. It will be slotted automatically.
        vehicle.addComponent(componentId, /* isSync= */ true);

        // Notify observers of the modification to this vehicle.
        this.notifyObservers('onVehicleMod', player, vehicle, componentId);
    }

    onVehiclePaintjob(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player)
            return;

        const vehicle = this.vehicles_.get(event.vehicleid);
        if (!vehicle)
            return;

        vehicle.setPaintjobInternal(event.paintjobid);

        this.notifyObservers('onVehiclePaintjob', player, vehicle, event.paintjobid);
    }

    onVehicleRespray(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player)
            return;

        const vehicle = this.vehicles_.get(event.vehicleid);
        if (!vehicle)
            return;

        vehicle.setColorsInternal(event.color1, event.color2);

        this.notifyObservers('onVehicleRespray', player, vehicle, event.color1, event.color2);
    }

    // ---------------------------------------------------------------------------------------------

    // Called when a trailer update has been reported by the Pawn driver. State is maintained by
    // Pawn to significantly reduce the load on JavaScript, in which calls are more expensive.
    reportTrailerUpdate(vehicleId, trailerId) {
        const vehicle = this.vehicles_.get(vehicleId) ?? null;
        const trailer = this.vehicles_.get(trailerId) ?? null;

        if (!vehicle)
            return 0;  // the |vehicle| is not known to JavaScript
        
        if (vehicle.trailer && vehicle.trailer !== trailer)
            vehicle.trailer.setParentInternal(null);

        vehicle.setTrailerInternal(trailer);

        if (!trailer)
            return 1;  // the |vehicle| had its trailer detached
        
        if (trailer.parent && trailer.parent !== vehicle)
            trailer.parent.setTrailerInternal(null);

        trailer.setParentInternal(vehicle);
        return 1;
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
            vehicle.trailer.setParentInternal(null);
            vehicle.setTrailerInternal(null);
        }

        this.vehicles_.delete(vehicle.id);
    }

    // Releases all references and state held by the vehicle manager.
    dispose() {
        this.disposed_ = true;

        provideNative('ReportTrailerUpdate', 'ii', () => 0);

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
