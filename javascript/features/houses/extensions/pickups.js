// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const HouseExtension = require('features/houses/house_extension.js');

// Extension that allows players to place health and armour pickups in their house.
class Pickups extends HouseExtension {
    constructor(manager, streamer) {
        super();

        this.manager_ = manager;

        this.streamer_ = streamer;
        this.streamer_.addReloadObserver(this, Pickups.prototype.onStreamerReloaded);
    }

    // Gets the global instance of the PickupStreamer. Value should not be cached.
    get streamer() { return this.streamer_().getPickupStreamer(); }

    // ---------------------------------------------------------------------------------------------

    // Adds a menu item to |menu| that enables the player to select their desired pickups.
    onHouseSettingsCommand(player, location, menu) {
        if (!player.isManagement())
            return;  // this feature hasn't launched yet
    }

    // ---------------------------------------------------------------------------------------------

    // Called when a house has been created in the |location|. The pickups, when available, will
    // be created on behalf of the location.
    onHouseCreated(location) {
        // TODO: Create the pickups with the streamer.
    }

    // Called when the house in the |location| is about to be removed. Remove any pickups from the
    // streamer that were created as part of it.
    onHouseRemoved(location) {
        // TODO: Remove the streamups from the streamer.
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the streamer has been reloaded. All pickups that were created as part of houses
    // should be re-added to the new instance.
    onStreamerReloaded() {
        // TODO: Recreate all previously added pickups with the streamer.
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.streamer_.removeReloadObserver(this);

        // TODO: Remove all the created pickups from the streamer.
    }
}

exports = Pickups;
