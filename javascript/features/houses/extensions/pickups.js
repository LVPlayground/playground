// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const HouseExtension = require('features/houses/house_extension.js');
const ScopedEntities = require('entities/scoped_entities.js');

// Extension that allows players to place health and armour pickups in their house.
class Pickups extends HouseExtension {
    constructor(manager) {
        super();

        this.manager_ = manager;

        // Manages the pickups that will be created for the players.
        this.entities_ = new ScopedEntities();
    }

    // Adds a menu item to |menu| that enables the player to select their desired pickups.
    onHouseSettingsCommand(player, location, menu) {
        // TODO: Display the menu.
    }

    // Called when the |player| has entered the house at |location|. This is where the necessary
    // pickups for the |location| will be created, if needed.
    onPlayerEnterHouse(player, location) {
        // TODO: Create the health and armour pickups if necessary.
    }

    // Called when the |player| has left the house at |location|. This is where we'll destroy the
    // pickups that were created for the |location|, if there were any.
    onPlayerLeaveHouse(player, location) {
        // TODO: Destroy the health and armour pickups if necessary.
    }

    dispose() {
        this.entities_.dispose();
        this.entities_ = null;
    }
}

exports = Pickups;
