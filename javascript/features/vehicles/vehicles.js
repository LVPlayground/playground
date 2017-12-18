// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Feature from 'components/feature_manager/feature.js';
import VehicleCommands from 'features/vehicles/vehicle_commands.js';
import VehicleManager from 'features/vehicles/vehicle_manager.js';
import VehicleNatives from 'features/vehicles/vehicle_natives.js';

// The Vehicles feature is responsible for the features one might find around San Andreas. It allows
// all players to create vehicles on demand, administrators to store and modify them persistently.
// The vehicles will be created through the streamer, so there is no strict limit to them.
class Vehicles extends Feature {
    constructor() {
        super();

        // Used for determining whether a player can spawn a vehicle.
        const abuse = this.defineDependency('abuse');

        // Used for making announcements to administrators.
        const announce = this.defineDependency('announce');

        // Used to add commands and vehicle access to the `/lvp access` console.
        const playground = this.defineDependency('playground');

        // Used to create and destroy the vehicles available on Las Venturas Playground.
        const streamer = this.defineDependency('streamer');

        this.manager_ = new VehicleManager(streamer);
        this.manager_.loadVehicles();

        this.natives_ = new VehicleNatives(this.manager_);

        this.commands_ = new VehicleCommands(this.manager_, abuse, announce, playground);
    }

    dispose() {
        this.commands_.dispose();
        this.commands_ = null;

        this.natives_.dispose();
        this.natives_ = null;

        this.manager_.dispose();
        this.manager_ = null;
    }
}

export default Vehicles;
