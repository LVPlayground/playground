// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Feature = require('components/feature_manager/feature.js');
const InteriorManager = require('features/location/interior_manager.js');
const LocationCommands = require('features/location/location_commands.js');

// The pattern selecting the appropriate files for the interior portals.
const PORTAL_DIRECTORY = 'data/portals';

// The location feature encapsulates capabilities related to a player's location: interior handling,
// teleportation, informational commands and so on.
class Location extends Feature {
    constructor() {
        super();

        this.interiorManager_ = new InteriorManager();
        this.locationCommands_ = new LocationCommands(this.interiorManager_);

        // Load all the portal definition files and create portals for them through the interior
        // manager. Each file can contain an arbitrary amount of portas.
        glob(PORTAL_DIRECTORY, '.*\.json').forEach(filename =>
            this.interiorManager_.loadPortalFile(PORTAL_DIRECTORY + '/' + filename));
    }

    // ---------------------------------------------------------------------------------------------

    // TODO: Define the public API for the Location feature.

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.locationCommands_.dispose();
        this.locationCommands_ = null;

        this.interiorManager_.dispose();
        this.interiorManager_ = null;
    }
}

exports = Location;
