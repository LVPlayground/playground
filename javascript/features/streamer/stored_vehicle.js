// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const StoredEntity = require('features/streamer/stored_entity.js');

// Details about a stored vehicle. This contains all the necessary information in order to create
// the vehicle, on demand, within the vehicle streamer.
class StoredVehicle extends StoredEntity {
    constructor({ modelId, position, rotation, interiorId, virtualWorld } = {}) {
        super({ modelId, position, interiorId, virtualWorld });

        this.rotation_ = rotation;
    }

    // Gets the rotation that this vehicle has been stored with.
    get rotation() { return this.rotation_; }
}

exports = StoredVehicle;
