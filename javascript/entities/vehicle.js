// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Supplementable } from 'base/supplementable.js';


// Represents and encapsulates the lifetime of a Vehicle on the San Andreas: Multiplayer server.
// Provides quick and idiomatic access to the vehicle's properties.
//
// This class amends the default SA-MP natives with additional functionality that keeps track of
// modifications to vehicles, and allows them to be retrieved on the fly.
//
// If you are considering extending the Player object with additional functionality, take a look at
// the Supplementable system in //base/supplementable.js instead.
class Vehicle extends Supplementable {
    // ID indicating that a particular Player ID is explicitly not valid.
    static kInvalidId = 65535;

    // Vehicle keys that can be awarded to players through various achievements.
    static kVehicleKeysBoost = 1;
    static kVehicleKeysColourChange = 2;
    static kVehicleKeysFix = 4;
    static kVehicleKeysFlip = 8;
    static kVehicleKeysJump = 16;
    static kVehicleKeysNos = 32;
    static kVehicleKeysBlinkerRight = 64;
    static kVehicleKeysBlinkerLeft = 128;

    // ---------------------------------------------------------------------------------------------

    #manager_ = null;
    #id_ = null;

    #modelId_ = null;
    #interiorId_ = null;
    #virtualWorld_ = null;

    #primaryColor_ = null;
    #secondaryColor_ = null;
    #paintjob_ = null;
    #numberPlate_ = null;
    #siren_ = null;

    #respawnDelay_ = null;

    constructor(manager) {
        super();

        this.#manager_ = manager;
    }

    initialize(options) {
        this.#modelId_ = options.modelId;
        this.#interiorId_ = options.interiorId ?? 0;
        this.#virtualWorld_ = options.virtualWorld ?? 0;

        this.#primaryColor_ = options.primaryColor;
        this.#secondaryColor_ = options.secondaryColor;
        this.#siren_ = options.siren;

        this.#respawnDelay_ = options.respawnDelay;

        this.#id_ = this.createVehicleInternal(options);
        if (this.#id_ === Vehicle.kInvalidId)
            throw new Error(`The vehicle (${this}) could not be created on the server.`);

        if (options.interiorId)
            this.interiorId = options.interiorId;
        
        if (options.virtualWorld)
            this.virtualWorld = options.virtualWorld;
        
        if (options.numberPlate)
            this.numberPlate = options.numberPlate;
        
        if (options.paintjob)
            this.paintjob = options.paintjob;
    }

    // Actually creates the vehicle on the server. Will return the ID of the newly created vehicle,
    // or kInvalidVehicleId when the vehicle could not be created.
    createVehicleInternal(options) {
        return pawnInvoke('CreateVehicle', 'iffffiiii',
            /* vehicletype= */ options.modelId,
            /* x= */ options.position.x,
            /* y= */ options.position.y,
            /* z= */ options.position.z,
            /* rotation= */ options.rotation,
            /* color1= */ options.primaryColor,
            /* color2= */ options.secondaryColor,
            /* respawn_delay= */ options.respawnDelay,
            /* addsiren= */ options.siren ? 1 : 0) || Vehicle.kInvalidId;
    }

    // Actually changes a vehicle's colours on the server.
    changeVehicleColorInternal(primaryColor, secondaryColor) {
        pawnInvoke('ChangeVehicleColor', 'iii', this.#id_, primaryColor, secondaryColor);
    }

    // Actually changes a vehicle's number plate on the server.
    changeVehicleNumberPlateInternal(numberPlate) {
        pawnInvoke('SetVehicleNumberPlate', 'is', this.#id_, numberPlate);
    }

    // Actually changes a vehicle's paintjob on the server.
    changeVehiclePaintjobInternal(paintjob) {
        pawnInvoke('ChangeVehiclePaintjob', 'ii', this.#id_, paintjob);
    }

    // ---------------------------------------------------------------------------------------------
    
    get id() { return this.#id_; }

    get modelId() { return this.#modelId_; }
    get model() { return VehicleModel.getById(this.#modelId_); }

    get primaryColor() { return this.#primaryColor_; }
    set primaryColor(value) {
        this.changeVehicleColorInternal(value, this.#secondaryColor_);
        this.#primaryColor_ = value;
    }

    get secondaryColor() { return this.#secondaryColor_; }
    set secondaryColor(value) {
        this.changeVehicleColorInternal(this.#primaryColor_, value);
        this.#secondaryColor_ = value;
    }

    get numberPlate() { return this.#numberPlate_; }
    set numberPlate(value) {
        this.changeVehicleNumberPlateInternal(value);
        this.#numberPlate_ = value;
    }

    get paintjob() { return this.#paintjob_; }
    set paintjob(value) {
        this.changeVehiclePaintjobInternal(value);
        this.#paintjob_ = value;
    }

    get siren() { return this.#siren_; }

    get respawnDelay() { return this.#respawnDelay_; }

    isConnected() { return this.id_ !== Vehicle.kInvalidId; }

    // ---------------------------------------------------------------------------------------------

    get health() { return pawnInvoke('GetVehicleHealth', 'iF', this.#id_); }
    set health(value) { pawnInvoke('SetVehicleHealth', 'if', this.#id_, value); }

    get position() { return new Vector(...pawnInvoke('GetVehiclePos', 'iFFF', this.#id_)); }
    set position(value) {
        pawnInfoke('SetVehiclePos', 'ifff', this.#id_, value.x, value.y, value.z);

        if (this.trailer_)
            pawnInvoke('AttachTrailerToVehicle', 'ii', this.trailer_.id, this.#id_);
    }

    get rotation() { return pawnInvoke('GetVehicleZAngle', 'iF', this.#id_); }
    set rotation(value) { pawnInvoke('SetVehicleZAngle', 'if', this.#id_, value); }

    get velocity() { return new Vector(...pawnInvoke('GetVehicleVelocity', 'iFFF', this.#id_)); }
    set velocity(velocity) {
        pawnInvoke('SetVehicleVelocity', 'ifff', this.#id_, velocity.x, velocity.y, velocity.z);
    }

    get interiorId() { return this.#interiorId_; }
    set interiorId(value) {
        pawnInvoke('LinkVehicleToInterior', 'ii', this.#id_, value);
        this.#interiorId_ = value;

        if (this.trailer_) {
            this.trailer_.interiorId = value;
            pawnInvoke('AttachTrailerToVehicle', 'ii', this.trailer_.id, this.#id_);
        }
    }

    get virtualWorld() { return this.#virtualWorld_; }
    set virtualWorld(value) {
        if (this.driver && this.driver.syncedData.isIsolated())
            return;

        pawnInvoke('SetVehicleVirtualWorld', 'ii', this.#id_, value);
        this.#virtualWorld_ = value;

        if (this.trailer_) {
            this.trailer_.virtualWorld = value;
            pawnInvoke('AttachTrailerToVehicle', 'ii', this.trailer_.id, this.#id_);
        }
    }

    // ---------------------------------------------------------------------------------------------




    

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





    // ---------------------------------------------------------------------------------------------

    // Attaches this vehicle to the given |trailer|.
    attachTrailer(trailer) {
        if (this.trailer_)
            this.#manager_.detachTrailer(this);

        pawnInvoke('AttachTrailerToVehicle', 'ii', trailer.id, this.id_);
        this.#manager_.attachTrailer(this, trailer);
    }

    // Detaches this vehicle from its current trailer.
    detachTrailer() {
        if (!this.trailer_)
            return;

        pawnInvoke('DetachTrailerFromVehicle', 'i', this.id_);
        this.#manager_.detachTrailer(this);
    }

    // Gets or sets the trailer that is attached to this vehicle.
    get trailer() { return this.trailer_; }
    set trailer(value) { this.trailer_ = value; }

    // Gets or sets the parent vehicle, that is, the vehicle that has this one as a trailer.
    get parent() { return this.parent_; }
    set parent(value) { this.parent_ = value; }

    // Finds the Id of the trailer attached to this vehicle. Should be used sparsely.
    findTrailerId() { return pawnInvoke('GetVehicleTrailer', 'i', this.id_); }

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
        this.locks_.add(player);
    }

    // Returns whether the vehicle is locked for |player|.
    isLockedForPlayer(player) { return this.locks_.has(player); }

    // Unlocks the vehicle for the |player|.
    unlockForPlayer(player) {
        if (!this.locks_.has(player))
            return;

        pawnInvoke('SetVehicleParamsForPlayer', 'iiii', this.id_, player.id, 0, 0 /* unlocked */);
        this.locks_.delete(player);
    }

    // ---------------------------------------------------------------------------------------------

    // Toggles whether the engine for this vehicle is running.
    toggleEngine(engineRunning) {
        const [engine, lights, alarm, doors, bonnet, boot, objective] =
            pawnInvoke('GetVehicleParamsEx', 'iIIIIIII', this.id_);
        
        if (!!engine === engineRunning)
            return;  // no change from the current engine status

        pawnInvoke('SetVehicleParamsEx', 'iiiiiiii', this.id_, engineRunning ? 1 : 0, lights, alarm,
                                                     doors, bonnet, boot, objective);
    }

    // ---------------------------------------------------------------------------------------------

    // Returns whether the vehicle is currently within streaming range of |player|.
    inRangeForPlayer(player) {
        return !!pawnInvoke('IsVehicleStreamedIn', 'ii', this.id_, player.id);
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
        this.#manager_.didDisposeVehicle(this);
        this.#manager_ = null;

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
