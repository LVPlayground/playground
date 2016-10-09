// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Feature = require('components/feature_manager/feature.js');
const InteriorManager = require('features/location/interior_manager.js');

// The pattern selecting the appropriate files for the interior portals.
const PORTAL_DIRECTORY = 'data/portals';

// The location feature encapsulates capabilities related to a player's location: interior handling,
// teleportation, informational commands and so on.
class Location extends Feature {
    constructor() {
        super();

        // Determines whether a player is allowed to teleport into an interior right now.
        const abuse = this.defineDependency('abuse');

        this.interiorManager_ = new InteriorManager(abuse);

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

    // Updates the |portal|'s |setting| to be |value|. The following settings are recognized:
    //
    //   'color'  Updates the color of the portal. Must be one of {yellow, red, green, blue}.
    //   'label'  Updates the text displayed on the portal's entrance.
    //
    updatePortalSetting(portal, setting, value) {
        this.interiorManager_.updatePortalSetting(portal, setting, value);
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
    }
}

exports = Location;
