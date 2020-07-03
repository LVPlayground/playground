// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Supplementable } from 'base/supplementable.js';
import { VehicleModel } from 'entities/vehicle_model.js';

import { canVehicleModelHaveComponent, getComponentSlot } from 'entities/vehicle_components.js';

// Represents and encapsulates the lifetime of a Vehicle on the San Andreas: Multiplayer server.
// Provides quick and idiomatic access to the vehicle's properties.
//
// This class amends the default SA-MP natives with additional functionality that keeps track of
// modifications to vehicles, and allows them to be retrieved on the fly.
//
// If you are considering extending the Player object with additional functionality, take a look at
// the Supplementable system in //base/supplementable.js instead.
export class Vehicle extends Supplementable {
    // ID indicating that a particular Player ID is explicitly not valid.
    static kInvalidId = 65535;

    // The component slots that vehicles can be modified with.
    static kComponentSlotSpoiler = 0;
    static kComponentSlotHood = 1;
    static kComponentSlotRoof = 2;
    static kComponentSlotRightSideskirt = 3;
    static kComponentSlotLeftSideskirt = 14;
    static kComponentSlotLights = 4;
    static kComponentSlotNitro = 5;
    static kComponentSlotExhaust = 6;
    static kComponentSlotWheels = 7;
    static kComponentSlotStereo = 8;
    static kComponentSlotHydraulics = 9;
    static kComponentSlotFrontBumper = 10;
    static kComponentSlotRearBumper = 11;
    static kComponentSlotRightVent = 12;
    static kComponentSlotLeftVent = 13;

    // Vehicle keys that can be awarded to players through various achievements.
    static kVehicleKeysBoost = 1;
    static kVehicleKeysColourChange = 2;
    static kVehicleKeysFix = 4;
    static kVehicleKeysFlip = 8;
    static kVehicleKeysJump = 16;
    static kVehicleKeysNos = 32;
    static kVehicleKeysBlinkerRight = 64;
    static kVehicleKeysBlinkerLeft = 128;
    static kVehicleKeysGravity = 256;

    // Constants that indicate the seat a player is occupying in the vehicle. Values above 1 are
    // possible. They indicate passenger seats in the rear seat or further beyond. (E.g. for a bus.)
    static kSeatDriver = 0;
    static kSeatPassenger = 1;
    static kSeatPassengerRearLeft = 2;
    static kSeatPassengerRearRight = 3;

    // Constants to use when adding components to vehicles.
    static kComponentNitroSingleShot = 1009;
    static kComponentNitroFiveShots = 1008;
    static kComponentNitroTenShots = 1010;

    // ---------------------------------------------------------------------------------------------

    #manager_ = null;
    #id_ = null;

    #modelId_ = null;
    #interiorId_ = null;
    #virtualWorld_ = null;

    #components_ = null;
    #primaryColor_ = null;
    #secondaryColor_ = null;
    #paintjob_ = null;
    #numberPlate_ = null;
    #siren_ = null;

    #parent_ = null;
    #trailer_ = null;

    #driver_ = null;
    #passengers_ = null;

    #respawnDelay_ = null;

    constructor(manager) {
        super();

        this.#manager_ = manager;
    }

    initialize(options) {
        this.#modelId_ = options.modelId;
        this.#interiorId_ = options.interiorId ?? 0;
        this.#virtualWorld_ = options.virtualWorld ?? 0;

        this.#components_ = new Map();
        this.#primaryColor_ = options.primaryColor;
        this.#secondaryColor_ = options.secondaryColor;
        this.#siren_ = options.siren;

        this.#passengers_ = new Set();
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

    // Actually adds the given |componentId| to the vehicle.
    addComponentInternal(componentId) {
        pawnInvoke('AddVehicleComponent', 'ii', this.#id_, componentId);
    }

    // Attaches the |trailer| to |this| when given, or detaches an existing trailer otherwise.
    attachTrailerInternal(trailer) {
        if (trailer)
            pawnInvoke('AttachTrailerToVehicle', 'ii', trailer.id, this.#id_);
        else
            pawnInvoke('DetachTrailerFromVehicle', 'i', this.#id_);
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

    // Actually removes the given |componentId| from the vehicle.
    removeComponentInternal(componentId) {
        pawnInvoke('RemoveVehicleComponent', 'ii', this.#id_, componentId);
    }

    // Actually sets the Interior ID and/or virtual world for this vehicle.
    setInteriorInternal(interiorId) {
        pawnInvoke('LinkVehicleToInterior', 'ii', this.#id_, interiorId);
    }

    setVirtualWorldInternal(virtualWorld) {
        pawnInvoke('SetVehicleVirtualWorld', 'ii', this.#id_, virtualWorld);
    }

    // Actually destroys the vehicle on the server.
    destroyVehicleInternal() { pawnInvoke('DestroyVehicle', 'i', this.#id_); }

    // ---------------------------------------------------------------------------------------------
    // Appearance and behavioural information.
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
    // World positioning and state information.
    // ---------------------------------------------------------------------------------------------

    get health() { return pawnInvoke('GetVehicleHealth', 'iF', this.#id_); }
    set health(value) { pawnInvoke('SetVehicleHealth', 'if', this.#id_, value); }

    get position() { return new Vector(...pawnInvoke('GetVehiclePos', 'iFFF', this.#id_)); }
    set position(value) {
        pawnInfoke('SetVehiclePos', 'ifff', this.#id_, value.x, value.y, value.z);

        if (this.#trailer_)
            this.attachTrailerInternal(this.#trailer_);
    }

    get rotation() { return pawnInvoke('GetVehicleZAngle', 'iF', this.#id_); }
    set rotation(value) { pawnInvoke('SetVehicleZAngle', 'if', this.#id_, value); }

    get velocity() { return new Vector(...pawnInvoke('GetVehicleVelocity', 'iFFF', this.#id_)); }
    set velocity(velocity) {
        pawnInvoke('SetVehicleVelocity', 'ifff', this.#id_, velocity.x, velocity.y, velocity.z);
    }

    get interiorId() { return this.#interiorId_; }
    set interiorId(value) {
        this.setInteriorInternal(value);
        this.#interiorId_ = value;

        if (this.#trailer_) {
            this.#trailer_.interiorId = value;
            this.attachTrailerInternal(this.#trailer_);
        }
    }

    get virtualWorld() { return this.#virtualWorld_; }
    set virtualWorld(value) {
        this.setVirtualWorldInternal(value);
        this.#virtualWorld_ = value;

        if (this.#trailer_) {
            this.#trailer_.virtualWorld = value;
            this.attachTrailerInternal(this.#trailer_);
        }
    }

    // ---------------------------------------------------------------------------------------------
    // Component information
    // ---------------------------------------------------------------------------------------------
    
    addComponent(componentId, isSync = false) {
        if (!canVehicleModelHaveComponent(this.#modelId_, componentId))
            return false;

        const componentSlot = getComponentSlot(componentId);

        this.#components_.set(componentSlot, componentId);
        if (!isSync)
            this.addComponentInternal(componentId);
        
        return true;
    }

    clearComponents(isSync = false) {
        if (!isSync) {
            for (const componentId of this.#components_.values())
                this.removeComponentInternal(componentId);
        }

        this.#components_.clear();
    }

    removeComponent(componentId) {
        const componentSlot = getComponentSlot(componentId);
        if (!componentSlot || this.#components_.get(componentSlot) !== componentId)
            return false;
        
        this.#components_.delete(componentSlot);

        this.removeComponentInternal(componentId);
        return true;
    }

    hasComponent(componentId) {
        const componentSlot = getComponentSlot(componentId);
        return componentSlot && this.#components_.get(componentSlot) === componentId;
    }

    getComponents() { return [ ...this.#components_.values() ]; }
    getComponentInSlot(slot) { return this.#components_.get(slot) ?? null; }

    // ---------------------------------------------------------------------------------------------
    // Trailer & parent functionality. Represented as Vehicle instances.
    // ---------------------------------------------------------------------------------------------

    get trailer() { return this.#trailer_; }
    set trailer(value) {
        if (this.#trailer_ && this.#trailer_ !== value)
            this.#trailer_.setParentInternal(null);

        this.attachTrailerInternal(value);
        if (value)
            value.setParentInternal(this);

        this.#trailer_ = value;
    }

    get parent() { return this.#parent_; }

    setParentInternal(parent) { this.#parent_ = parent; }
    setTrailerInternal(trailer) { this.#trailer_ = trailer; }

    // ---------------------------------------------------------------------------------------------
    // Occupant information
    // ---------------------------------------------------------------------------------------------

    get driver() { return this.#driver_; }

    get occupantCount() { return this.#passengers_.size + (this.#driver_ ? 1 : 0); }

    isOccupied() { return this.#driver_ || this.#passengers_.size; }

    *getPassengers() { yield* this.#passengers_.values(); }

    *getOccupants() {
        if (this.#driver_)
            yield this.#driver_;

        yield* this.#passengers_;
    }

    // ---------------------------------------------------------------------------------------------

    onPlayerEnterVehicle(player) {
        if (player.vehicleSeat === Vehicle.kSeatDriver)
            this.#driver_ = player;
        else
            this.#passengers_.add(player);
    }

    onPlayerLeaveVehicle(player) {
        if (player.vehicleSeat === Vehicle.kSeatDriver)
            this.#driver_ = null;
        else
            this.#passengers_.delete(player);
    }

    // ---------------------------------------------------------------------------------------------
    // Utility functions that make the Vehicle easier to use.
    // ---------------------------------------------------------------------------------------------

    respawn() { pawnInvoke('SetVehicleToRespawn', 'i', this.#id_); }

    repair() { pawnInvoke('RepairVehicle', 'i', this.#id_); }

    toggleEngine(engineRunning) {
        const [engine, lights, alarm, doors, bonnet, boot, objective] =
            pawnInvoke('GetVehicleParamsEx', 'iIIIIIII', this.#id_);
        
        if (!!engine === engineRunning)
            return;  // no change from the current engine status

        pawnInvoke(
            'SetVehicleParamsEx', 'iiiiiiii', this.#id_, engineRunning ? 1 : 0, lights, alarm,
                                              doors, bonnet, boot, objective);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.#manager_.didDisposeVehicle(this);
        this.#manager_ = null;

        this.destroyVehicleInternal();

        this.id_ = Vehicle.kInvalidId;
    }

    // ---------------------------------------------------------------------------------------------

    toString() { return `[object Vehicle(${this.#id_}, ${this.#modelId_})]`; }
}

// Expose the Vehicle object globally since it will be commonly used.
global.Vehicle = Vehicle;
