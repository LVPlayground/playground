// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import StoredEntity from 'features/streamer/stored_entity.js';

// Details about a stored vehicle. This contains all the necessary information in order to create
// the vehicle, on demand, within the vehicle streamer.
class StoredVehicle extends StoredEntity {
    constructor({ modelId, position, rotation, interiorId, virtualWorld, primaryColor = -1,
                  secondaryColor = -1, paintjob = null, numberPlate = null, siren = false,
                  respawnDelay = 180, deathFn = null, respawnFn = null, accessFn = null } = {}) {
        super({ modelId, position, interiorId, virtualWorld });

        this.rotation_ = rotation;

        this.primaryColor_ = primaryColor;
        this.secondaryColor_ = secondaryColor;
        this.paintjob_ = paintjob;
        this.numberPlate_ = numberPlate;

        this.siren_ = siren;
        this.respawnDelay_ = respawnDelay;

        this.deathFn_ = deathFn;
        this.respawnFn_ = respawnFn;
        this.accessFn_ = accessFn;
    }

    // Gets the rotation that this vehicle has been stored with.
    get rotation() { return this.rotation_; }

    // Gets the primary and secondary colours that should be applied to this vehicle.
    get primaryColor() { return this.primaryColor_; }
    get secondaryColor() { return this.secondaryColor_; }

    // Gets the paintjob that should be applied to this vehicle.
    get paintjob() { return this.paintjob_; }

    // Gets the text that should be displayed on the vehicle's number plate.
    get numberPlate() { return this.numberPlate_; }

    // Gets whether this vehicle should have a siren if it doesn't have one by default.
    get siren() { return this.siren_; }

    // Gets the respawn delay of the vehicle, in seconds. A respawn delay of -1 means that the
    // vehicle streamer will never respawn the vehicle by itself.
    get respawnDelay() { return this.respawnDelay_; }

    // Gets the function that should be executed when the vehicle has died, just before it respawns.
    get deathFn() { return this.deathFn_; }

    // Gets the function that should be executed when the vehicle has respawned. Avoids needing to
    // observe all vehicle respawns in each user of the vehicle streamer.
    get respawnFn() { return this.respawnFn_; }

    // Gets the function that should be executed to decide whether a player has access to enter the
    // vehicle or not. Will be called each time the vehicle streams in for a player. May be NULL.
    get accessFn() { return this.accessFn_; }
}

export default StoredVehicle;
