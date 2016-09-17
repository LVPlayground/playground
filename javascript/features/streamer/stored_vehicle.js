// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const StoredEntity = require('features/streamer/stored_entity.js');

// Details about a stored vehicle. This contains all the necessary information in order to create
// the vehicle, on demand, within the vehicle streamer.
class StoredVehicle extends StoredEntity {
    constructor({ modelId, position, rotation, interiorId, virtualWorld, primaryColor = -1,
                  secondaryColor = -1, paintjob = null, siren = false, respawnDelay = 180 } = {}) {
        super({ modelId, position, interiorId, virtualWorld });

        this.rotation_ = rotation;

        this.primaryColor_ = primaryColor;
        this.secondaryColor_ = secondaryColor;
        this.paintjob_ = paintjob;

        this.siren_ = siren;
        this.respawnDelay = respawnDelay;
    }

    // Gets the rotation that this vehicle has been stored with.
    get rotation() { return this.rotation_; }

    // Gets the primary and secondary colours that should be applied to this vehicle.
    get primaryColor() { return this.primaryColor_; }
    get secondaryColor() { return this.secondaryColor_; }

    // Gets the paintjob that should be applied to this vehicle.
    get paintjob() { return this.paintjob_; }

    // Gets whether this vehicle should have a siren if it doesn't have one by default.
    get siren() { return this.siren_; }

    // Gets the respawn delay of the vehicle, in seconds.
    get respawnDelay() { return this.respawnDelay_; }
}

exports = StoredVehicle;
