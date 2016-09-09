// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// There are many features associated with houses that need some amount of logic or settings, but
// can be implemented separately of the core of the feature. House extensions will, once registered,
// be informed of important events that enable them to function independently.
class HouseExtension {
    constructor() {}

    // Called when the |location| has been created by an administrator.
    onLocationCreated(location) {}

    // Called when the |location| has been assigned a house, and is no longer available.
    onHouseCreated(location) {}

    // Called when the |player| has entered the house at |location|.
    onPlayerEnterHouse(player, location) {}

    // Called when the |player| has left the house at |location|.
    onPlayerLeaveHouse(player, location) {}

    // Called when an administrator has typed `/house modify`. The extension has the ability to add
    // new options to the |menu|, which is an instance of //components/menu/menu.js.
    onHouseModifyCommand(player, location, menu) {}

    // Called when a player has typed `/house settings`. The extension has the ability to add new
    // options to the |menu|, which is an instance of //components/menu/menu.js.
    onHouseSettingsCommand(player, location, menu) {}

    // Called when the |location| is about to become available by removal of the assigned house.
    onHouseRemoved(location) {}

    // Called when the |location| is about to be removed by an administrator.
    onLocationRemoved(location) {}

    // ---------------------------------------------------------------------------------------------

    // Callback that exists for testing purposes only. Should not be overridden by extensions.
    onQuackForTests() {}

    // ---------------------------------------------------------------------------------------------

    dispose() {}
}

exports = HouseExtension;
