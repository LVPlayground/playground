// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Feature } from 'components/feature_manager/feature.js';
import VehicleCommands from 'features/vehicles/vehicle_commands.js';
import VehicleManager from 'features/vehicles/vehicle_manager.js';
import { VehicleDecorations } from 'features/vehicles/vehicle_decorations.js';

// The Vehicles feature is responsible for the features one might find around San Andreas. It allows
// all players to create vehicles on demand, administrators to store and modify them persistently.
// The vehicles will be created through the streamer, so there is no strict limit to them.
class Vehicles extends Feature {
    commands_ = null;
    decorations_ = null;
    manager_ = null;

    constructor() {
        super();

        // Used for determining whether a player can spawn a vehicle.
        const abuse = this.defineDependency('abuse');

        // Used for making announcements to administrators.
        const announce = this.defineDependency('announce');

        // Used to determine whether players get access to special vehicle goodies.
        const collectables = this.defineDependency('collectables');

        // Used to add commands and vehicle access to the `/lvp access` console.
        const playground = this.defineDependency('playground');

        // Used to create and destroy the vehicles available on Las Venturas Playground.
        const streamer = this.defineDependency('streamer');

        // Used for decorations
        const settings = this.defineDependency('settings');

        // The VehicleManager is responsible for loading and keeping track of all vehicles created
        // by this feature, which includes the ephemeral vehicles.
        this.manager_ = new VehicleManager(settings, streamer);

        // Provides the `/v` command, as well as various other commands for quick vehicle access and
        // maintenance & control of the vehicles created on the server.
        this.commands_ = new VehicleCommands(
            this.manager_, abuse, announce, collectables, playground, streamer);

        // Able to spawn rich, decorated vehicles on the server.
        this.decorations_ = new VehicleDecorations(settings, announce);
    }

    dispose() {
        this.commands_.dispose();
        this.commands_ = null;

        this.manager_.dispose();
        this.manager_ = null;
        
        this.decorations_.dispose();
        this.decorations_ = null;
    }
}

export default Vehicles;
