// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Details a streamable vehicle that has been registered on the server. Provides access to the
// vehicle's information, as well as details about it's current liveness on the server.
export class StreamableVehicle {
    info_ = null;

    constructor(info) {
        this.info_ = info;
    }

    // ---------------------------------------------------------------------------------------------
    // API methods

    isEphemeral() { return this.info_.respawnDelay === null; }
    isPersistent() { return this.info_.respawnDelay !== null; }

    // ---------------------------------------------------------------------------------------------
    // StreamableVehicleInfo accessors

    get modelId() { return this.info_.modelId; }

    get position() { return this.info_.position; }
    get rotation() { return this.info_.rotation; }
    
    get primaryColor() { return this.info_.primaryColor; }
    get secondaryColor() { return this.info_.secondaryColor; }
    get siren() { return this.info_.siren; }

    get respawnDelay() { return this.info_.respawnDelay; }

    // ---------------------------------------------------------------------------------------------

    toString() { return `[object StreamableVehicle(${this.modelId}, position: ${this.position})]`; }
}
