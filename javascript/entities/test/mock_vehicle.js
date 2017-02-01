// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Supports exactly the same API as a regular Vehicle entity, but will only store the data locally
// instead of actually creating the vehicle on the server.
class MockVehicle {
    constructor(manager, options) {
        this.manager_ = manager;
        this.id_ = Math.floor(Math.random() * 10000000);

        this.driver_ = null;
        this.passengers_ = new Set();

        this.modelId_ = options.modelId;

        this.originalPosition_ = options.position;
        this.position_ = options.position;

        this.originalRotation_ = options.rotation;
        this.rotation_ = options.rotation;

        this.primaryColor_ = options.primaryColor;
        this.secondaryColor_ = options.secondaryColor;
        this.siren_ = options.siren;
        this.respawnDelay_ = options.respawnDelay;

        this.paintjob_ = options.paintjob;

        this.interiorId_ = options.interiorId;
        this.virtualWorld_ = options.virtualWorld;

        this.numberPlate_ = options.numberPlate;

        this.respawnCounter_ = 0;
        this.health_ = 1000;

        this.trailer_ = null;
        this.trailerId_ = 0;
        this.parent_ = null;

        this.locked_ = new WeakSet();
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
    get position() { return this.position_; }
    set position(value) {
        this.position_ = value;

        if (this.trailer_)
            this.trailer_.position = value;
    }

    // Gets or sets the rotation of this vehicle.
    get rotation() { return this.rotation_; }
    set rotation(value) { this.rotation_ = value; }

    // Returns whether the vehicle is currently occupied by any player.
    isOccupied() { return this.driver_ || this.passengers_.size; }

    // Gets the number of occupants that are currently in the vehicle.
    get occupantCount() { return this.passengers_.size + (this.driver_ ? 1 : 0); }

    // Gets the Player that is currently driving this vehicle. May be NULL.
    get driver() { return this.driver_; }

    // Returns an iterator with the passengers that are currently driving in this vehicle.
    *getPassengers() { yield* this.passengers_.values(); }

    // Returns an iterator with the occupants that are currently driving in this vehicle.
    *getOccupants() {
        if (this.driver_)
            yield this.driver_;

        yield* this.passengers_;
    }

    // Gets or sets the primary colour of this vehicle.
    get primaryColor() { return this.primaryColor_; }
    set primaryColor(value) { this.primaryColor_ = value; }

    // Gets or sets the secondary colour of this vehicle.
    get secondaryColor() { return this.secondaryColor_; }
    set secondaryColor(value) { this.secondaryColor_ = value; }

    // Sets both colors of this vehicle at once instead of having to pawnInvoke twice
    setColors(primaryColor, secondaryColor) {
        this.primaryColor_ = primaryColor;
        this.secondaryColor_ = secondaryColor;
    }

    // Gets or sets the paintjob that have been applied to this vehicle.
    get paintjob() { return this.paintjob_; }
    set paintjob(value) { this.paintjob_ = value; }

    // Gets whether the vehicle has been forced to have a siren.
    get siren() { return this.siren_; }

    // Gets the delay, in seconds, after which the vehicle should be respawned without a driver.
    get respawnDelay() { return this.respawnDelay_; }

    // Gets or sets the interior that this vehicle has been linked to.
    get interiorId() { return this.interiorId_; }
    set interiorId(value) {
        this.interiorId_ = value;

        if (this.trailer_)
            this.trailer_.interiorId = value;
    }

    // Gets or sets the virtual world this vehicle is tied to.
    get virtualWorld() { return this.virtualWorld_; }
    set virtualWorld(value) {
        this.virtualWorld_ = value;

        if (this.trailer_)
            this.trailer_.virtualWorld = value;
    }

    // Gets or sets the health of this vehicle. Should generally be between 0 and 1000.
    get health() { return this.health_; }
    set health(value) { this.health_ = value; }

    // Gets or sets the numberplate text of this vehicle. May be NULL.
    get numberPlate() { return this.numberPlate_; }
    set numberPlate(value) { this.numberPlate_ = value; }

    // ---------------------------------------------------------------------------------------------

    // Attaches this vehicle to the given |trailer|.
    attachTrailer(trailer) {
        if (this.trailer_)
            this.manager_.detachTrailer(this);

        this.trailerId_ = trailer.id;
        this.manager_.attachTrailer(this, trailer);
    }

    // Detaches this vehicle from its current trailer.
    detachTrailer() {
        if (!this.trailer_)
            return;

        this.trailerId_ = 0;
        this.manager_.detachTrailer(this);
    }

    // Gets or sets the trailer that is attached to this vehicle.
    get trailer() { return this.trailer_; }
    set trailer(value) { this.trailer_ = value; }

    // Gets or sets the parent vehicle, that is, the vehicle that has this one as a trailer.
    get parent() { return this.parent_; }
    set parent(value) { this.parent_ = value; }

    // Finds the Id of the trailer attached to this vehicle. Should be used sparsely.
    findTrailerId() { return this.trailerId_; }

    // Sets the trailer Id for this vehicle. Should only be used for testing.
    setTrailerId(trailerId) { this.trailerId_ = trailerId; }

    // ---------------------------------------------------------------------------------------------

    // Respawns a vehicle back to the state and position it was created by.
    respawn() {
        this.respawnCounter_++;
        this.position_ = this.originalPosition_;
        this.rotation_ = this.originalRotation_;

        this.clearOccupants();

        global.dispatchEvent('vehiclespawn', {
            vehicleid: this.id_
        });
    }

    // Gets the number of times this vehicle has respawned. Only available for testing.
    get respawnCount() { return this.respawnCounter_; }

    // Repairs the vehicle. This resets the visual damage state as well.
    repair() { this.health_ = 1000; }

    // Adds |componentId| to this vehicle. No verification will be done on whether the component is
    // valid for this vehicle. Components can be added multiple times.
    addComponent(componentId) {}

    // ---------------------------------------------------------------------------------------------

    // Locks the vehicle for the |player|.
    lockForPlayer(player) { this.locked_.add(player); }

    // For testing. Returns whether the vehicle is locked for the |player|.
    isLockedForPlayer(player) { return this.locked_.has(player); }

    // Unlocks the vehicle for the |player|.
    unlockForPlayer(player) { this.locked_.delete(player); }

    // ---------------------------------------------------------------------------------------------

    // Returns whether the vehicle is currently within streaming range of |player|.
    inRangeForPlayer(player) {
        return player.position.squaredDistanceTo(this.position_) < (300 * 300);
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

    // Removes all occupants from the vehicle by issuing state change events.
    clearOccupants() {
        for (const player of this.getOccupants()) {
            global.dispatchEvent('playerstatechange', {
                playerid: player.id,
                oldstate: player.vehicleSeat == Vehicle.SEAT_DRIVER ? Player.STATE_DRIVER
                                                                    : Player.STATE_PASSENGER,
                newstate: Player.STATE_ON_FOOT
            });
        }
    }

    // Streams the vehicle in for the |player|.
    streamInForPlayer(player) {
        global.dispatchEvent('vehiclestreamin', {
            vehicleid: this.id_,
            forplayerid: player.id
        });
    }

    // Streams the vehicle out for the |player|.
    streamOutForPlayer(player) {
        this.locked_.delete(player);

        global.dispatchEvent('vehiclestreamout', {
            vehicleid: this.id_,
            forplayerid: player.id
        });
    }

    // Triggers an event informing the server that this vehicle has spawned.
    spawn() {
        global.dispatchEvent('vehiclespawn', {
            vehicleid: this.id_
        });
    }

    // Triggers an event informing the server that this vehicle has died.
    death() {
        global.dispatchEvent('vehicledeath', {
            vehicleid: this.id_,
            killerid: Player.INVALID_ID
        });
    }

    // ---------------------------------------------------------------------------------------------

    // Disposes the vehicle by removing it from the server.
    dispose() {
        this.manager_.didDisposeVehicle(this);
        this.manager_ = null;

        this.locked_ = null;

        this.clearOccupants();

        this.id_ = null;
    }
}

exports = MockVehicle;
