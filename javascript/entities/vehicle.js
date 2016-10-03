// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Represents and encapsulates the lifetime of a Vehicle on the San Andreas: Multiplayer server.
// Provides quick and idiomatic access to the vehicle's properties. 
class Vehicle {
    constructor(manager, options) {
        this.manager_ = manager;
        this.modelId_ = options.modelId;
        this.siren_ = !!options.siren;
        this.respawnDelay_ = options.respawnDelay;

        this.driver_ = null;
        this.passengers_ = new Set();

        // TODO(Russell): Synchronize these with the OnVehicleRespray event.
        this.primaryColor_ = options.primaryColor;
        this.secondaryColor_ = options.secondaryColor;

        // TODO(Russell): Synchronize these with the OnVehiclePaintjob event.
        this.paintjob_ = options.paintjob;

        this.interiorId_ = options.interiorId || 0;

        this.id_ = pawnInvoke('CreateVehicle', 'iffffiiii', options.modelId, options.position.x,
                              options.position.y, options.position.z, options.rotation,
                              options.primaryColor, options.secondaryColor, options.respawnDelay,
                              options.siren ? 1 : 0);

        if (this.id_ == Vehicle.INVALID_ID)
            throw new Error('Unable to create the vehicle on the SA-MP server.');

        if (options.paintjob)
            this.paintjob = options.paintjob;

        if (options.interiorId)
            this.interiorId = options.interiorId;

        if (options.virtualWorld)
            this.virtualWorld = options.virtualWorld;
    }

    // Returns whether this vehicle has been created on the server.
    isConnected() { return this.id_ !== null; }

    // Gets the Id of this vehicle as assigned by the SA-MP server.
    get id() { return this.id_; }

    // Gets the VehicleModel instance representing this vehicle's model Id.
    get model() { return VehicleModel.getById(this.modelId_); }

    // Gets the model Id associated with this vehicle.
    get modelId() { return this.modelId_; }

    // Gets or sets the position of this vehicle.
    get position() { return new Vector(...pawnInvoke('GetVehiclePos', 'iFFF', this.id_)); }
    set position(value) {
        pawnInfoke('SetVehiclePos', 'ifff', this.id_, value.x, value.y, value.z);
    }

    // Gets or sets the rotation of this vehicle.
    get rotation() { return pawnInvoke('GetVehicleZAngle', 'iF', this.id_); }
    set rotation(value) { pawnInvoke('SetVehicleZAngle', 'if', this.id_, value); }

    // Returns whether the vehicle is currently occupied by any player.
    isOccupied() { return this.driver_ || this.passengers_.size; }

    // Gets the number of occupants that are currently in the vehicle.
    get occupantCount() { return this.passengers_.size + (this.driver_ ? 1 : 0); }

    // Gets the Player that is currently driving this vehicle. May be NULL.
    get driver() { return this.driver_; }

    // Returns an iterator with the passengers that are currently driving in this vehicle.
    *getPassengers() { yield this.passengers_.values(); }

    // Returns an iterator with the occupants that are currently driving in this vehicle.
    *getOccupants() {
        if (this.driver_)
            yield this.driver_;

        yield* this.passengers_;
    }

    // Gets or sets the primary colour of this vehicle.
    get primaryColor() { return this.primaryColor_; }
    set primaryColor(value) {
        pawnInvoke('ChangeVehicleColor', 'iii', this.id_, value, this.secondaryColor_);
        this.primaryColor_ = value;
    }

    // Gets or sets the secondary colour of this vehicle.
    get secondaryColor() { return this.secondaryColor_; }
    set secondaryColor(value) {
        pawnInvoke('ChangeVehicleColor', 'iii', this.id_, this.primaryColor_, value);
        this.secondaryColor_ = value;
    }

    // Gets or sets the paintjob that have been applied to this vehicle.
    get paintjob() { return this.paintjob_; }
    set paintjob(value) {
        pawnInvoke('ChangeVehiclePaintjob', 'ii', this.id_, value);
        this.paintjob_ = value;
    }

    // Gets whether the vehicle has been forced to have a siren.
    get siren() { return this.siren_; }

    // Gets the delay, in seconds, after which the vehicle should be respawned without a driver.
    get respawnDelay() { return this.respawnDelay_; }

    // Gets or sets the interior that this vehicle has been linked to.
    get interiorId() { return this.interiorId_; }
    set interiorId(value) {
        pawnInvoke('LinkVehicleToInterior', 'ii', this.id_, value);
        this.interiorId_ = value;
    }

    // Gets or sets the virtual world this vehicle is tied to.
    get virtualWorld() { return pawnInvoke('GetVehicleVirtualWorld', 'i', this.id_); }
    set virtualWorld(value) { pawnInvoke('SetVehicleVirtualWorld', 'ii', this.id_, value); }

    // Gets or sets the health of this vehicle. Should generally be between 0 and 1000.
    get health() { return pawnInvoke('GetVehicleHealth', 'iF', this.id_); }
    set health(value) { pawnInvoke('SetVehicleHealth', 'if', this.id_, value); }

    // Gets or sets the velocity of the vehicle. Both must be used with a 3D vector.
    get velocity() { return new Vector(...pawnInvoke('GetVehicleVelocity', 'iFFF', this.id_)); }
    set velocity(value) {
        pawnInvoke('SetVehicleVelocity', 'ifff', this.id_, value.x, value.y, value.z);
    }

    // ---------------------------------------------------------------------------------------------

    // Respawns a vehicle back to the state and position it was created by.
    respawn() { pawnInvoke('SetVehicleToRespawn', 'i', this.id_); }

    // Repairs the vehicle. This resets the visual damage state as well.
    repair() { pawnInvoke('RepairVehicle', 'i', this.id_); }

    // Adds |componentId| to this vehicle. No verification will be done on whether the component is
    // valid for this vehicle. Components can be added multiple times.
    addComponent(componentId) {
        pawnInvoke('AddVehicleComponent', 'ii', this.id_, componentId);
    }

    // ---------------------------------------------------------------------------------------------

    // Locks the vehicle for the |player|.
    lockForPlayer(player) {
        pawnInvoke('SetVehicleParamsForPlayer', 'iiii', this.id_, player.id, 0, 1 /* locked */);
    }

    // Unlocks the vehicle for the |player|.
    unlockForPlayer(player) {
        pawnInvoke('SetVehicleParamsForPlayer', 'iiii', this.id_, player.id, 0, 1 /* unlocked */);
    }

    // ---------------------------------------------------------------------------------------------

    // Called by the vehicle manager when |player| has entered this vehicle.
    onPlayerEnterVehicle(player) {
        if (player.vehicleSeat === Vehicle.SEAT_DRIVER)
            this.driver_ = player;
        else
            this.passengers_.add(player);
    }

    // Called by the vehicle manager when |player| has left this vehicle.
    onPlayerLeaveVehicle(player) {
        if (player.vehicleSeat === Vehicle.SEAT_DRIVER)
            this.driver_ = null;
        else
            this.passengers_.delete(player);
    }

    // ---------------------------------------------------------------------------------------------

    // Disposes the vehicle by removing it from the server.
    dispose() {
        this.manager_.didDisposeVehicle(this);
        this.manager_ = null;

        pawnInvoke('DestroyVehicle', 'i', this.id_);
        this.id_ = null;
    }
}

// The Id that is used to represent invalid vehicles.
Vehicle.INVALID_ID = 65535;

// Commonly used components that can be added to vehicles, e.g. NOS.
Vehicle.COMPONENT_NOS_SINGLE_SHOT = 1009;
Vehicle.COMPONENT_NOS_FIVE_SHOTS = 1008;
Vehicle.COMPONENT_NOS_TEN_SHOTS = 1010;

// Constants that indicate the seat a player is occupying in the vehicle. Values above 1 are
// possible. They indicate passenger seats in the rear seat or further beyond. (E.g. for a bus.)
Vehicle.SEAT_DRIVER = 0;
Vehicle.SEAT_PASSENGER = 1;

// Expose the Vehicle object globally since it will be commonly used.
global.Vehicle = Vehicle;
