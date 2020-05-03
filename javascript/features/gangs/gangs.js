// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Feature from 'components/feature_manager/feature.js';
import GangCommands from 'features/gangs/gang_commands.js';
import GangManager from 'features/gangs/gang_manager.js';

// Implementation of the gangs feature. A gang is a group of players that fight together under a
// collaborative name. They get a shared bank account, have a private-ish group chat available to
// them and will be displayed on the Gangs section of the website.
class Gangs extends Feature {
    constructor() {
        super();

        // Used for announcing gang-related events to players and administrators.
        const announce = this.defineDependency('announce');

        this.manager_ = new GangManager();
        this.commands_ = new GangCommands(this.manager_, announce);
    }

    // ---------------------------------------------------------------------------------------------
    // Public API of the gangs feature.
    // ---------------------------------------------------------------------------------------------

    // Adds the |observer| as a gang mutation observer, that will be informed of changes in the
    // members that are part of a gang. The |observer| can implement the following methods that will
    // be informed of changes within a gang:
    //
    //     onGangMemberConnected(userId, gangId)
    //     onGangSettingUpdated(gang)
    //     onUserJoinGang(userId, gangId)
    //     onUserLeaveGang(userId, gangId)
    //
    // Events are based on users as opposed to players because mutations can happen whilst the
    // target player is offline.
    addObserver(observer) {
        this.manager_.addObserver(observer);
    }

    // Removes the |observer| from the list of gang mutation observers.
    removeObserver(observer) {
        this.manager_.removeObserver(observer);
    }

    // Returns an array with the gangs that currently exist on Las Venturas Playground.
    getGangs() {
        return this.manager_.gangs;
    }

    // Returns the gang that the |player| is part of, or NULL otherwise.
    getGangForPlayer(player) {
        return this.manager_.gangForPlayer(player);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.commands_.dispose();
        this.manager_.dispose();
    }
}

export default Gangs;

