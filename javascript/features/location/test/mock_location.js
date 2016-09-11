// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Feature = require('components/feature_manager/feature.js');
const InteriorAbuseManager = require('features/location/interior_abuse_manager.js');
const InteriorManager = require('features/location/interior_manager.js');

// Mocked version of the Location feature providing the API interfaces.
class MockLocation extends Feature {
    constructor() {
        super();

        this.interiorAbuseManager_ = new InteriorAbuseManager();
        this.interiorManager_ = new InteriorManager(this.interiorAbuseManager_);

        this.interiorAbusers_ = new WeakSet();
    }

    // ---------------------------------------------------------------------------------------------

    // Returns whether the |player| is allowed to teleport right now.
    canPlayerTeleport(player) {
        if (this.interiorAbusers_.has(player))
            return false;

        return this.interiorAbuseManager_.canPlayerTeleport(player);
    }

    // Creates the teleportation |portal| in the Interior Manager. The |portal| must be a complete
    // instance of the Portal class.
    createPortal(portal) {
        this.interiorManager_.createPortal(portal, false /* isToggleable */);
    }

    // Updates the |portal|'s |setting| to be |value|.
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
    // APIs available for testing purposes

    // Gets the number of portals that have been created in the interior manager.
    get portalCount() { return this.interiorManager_.portalCount; }

    // Toggles whether the |player| should be recognized as an interior abuser.
    toggleInteriorAbuser(player, abuser = true) {
        if (abuser)
            this.interiorAbusers_.add(player);
        else
            this.interiorAbusers_.delete(player);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.interiorManager_.dispose();
        this.interiorManager_ = null;

        this.interiorAbuseManager_.dispose();
        this.interiorAbuseManager_ = null;
    }
}

exports = MockLocation;
