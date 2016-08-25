// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Feature = require('components/feature_manager/feature.js');
const InteriorAbuseManager = require('features/location/interior_abuse_manager.js');
const InteriorManager = require('features/location/interior_manager.js');
const TeleportationManager = require('features/location/teleportation_manager.js');
const TeleportationCommands = require('features/location/teleportation_commands.js');

// The pattern selecting the appropriate files for the interior portals.
const PORTAL_DIRECTORY = 'data/portals';

// The location feature encapsulates capabilities related to a player's location: interior handling,
// teleportation, informational commands and so on.
class Location extends Feature {
    constructor() {
        super();

        this.interiorAbuseManager_ = new InteriorAbuseManager();

        this.interiorManager_ = new InteriorManager(this.interiorAbuseManager_);

        this.teleportationManager_ = new TeleportationManager();
        this.teleportationCommands_ = new TeleportationCommands(this.teleportationManager_);

        // Load all the portal definition files and create portals for them through the interior
        // manager. Each file can contain an arbitrary amount of portas.
        glob(PORTAL_DIRECTORY, '.*\.json').forEach(filename =>
            this.interiorManager_.loadPortalFile(PORTAL_DIRECTORY + '/' + filename));
    }

    // ---------------------------------------------------------------------------------------------

    // Creates the teleportation |portal| in the Interior Manager. The |portal| must be a complete
    // instance of the Portal class.
    createPortal(portal) {
        this.interiorManager_.createPortal(portal, false /* isToggleable */);
    }

    // Updates the |portal|'s label to be |label|.
    updatePortalLabel(portal, label) {
        this.interiorManager_.updatePortalLabel(portal, label);
    }

    // Makes |player| enter the |portal|. The given |direction| must be one of ["entrance","exit"].
    // Permission checks will be skipped for this API.
    enterPortal(player, portal, direction) {
        this.interiorManager_.enterPortal(player, portal, direction);
    }

    // Removes the teleportation |portal| from the Interior Manager. The |portal| must be a complete
    // instance of the Portal class that previously was added using createPortal().
    removePortal(portal) {
        this.interiorManager_.removePortal(portal);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.interiorManager_.dispose();
        this.interiorManager_ = null;

        this.interiorAbuseManager_.dispose();
        this.interiorAbuseManager_ = null;

        this.teleportationManager_.dispose();
        this.teleportationManager_ = null;

        this.teleportationCommands_.dispose();
        this.teleportationCommands_ = null;
    }
}

exports = Location;
