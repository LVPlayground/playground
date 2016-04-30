// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Feature = require('components/feature_manager/feature.js');
const GangCommands = require('features/gangs/gang_commands.js');
const GangManager = require('features/gangs/gang_manager.js');

// Implementation of the gangs feature. A gang is a group of players that fight together under a
// collaborative name. They get a shared bank account, have a private-ish group chat available to
// them and will be displayed on the Gangs section of the website.
class Gangs extends Feature {
    constructor() {
        super();

        this.manager_ = new GangManager(server.database);
        this.commands_ = new GangCommands(this.manager_);
    }

    // ---------------------------------------------------------------------------------------------
    // Public API of the gangs feature.
    // ---------------------------------------------------------------------------------------------

    // Returns an array with the gangs that currently exist on Las Venturas Playground.
    getGangs() {
        return this.manager_.gangs;
    }

    // Returns the gang that the |player| is part of, or NULL otherwise.
    getGangForPlayer(player) {
        return this.manager_.gangForPlayer(player);
    }

    // ---------------------------------------------------------------------------------------------

    // Cleans up all routines and state stored as part of the gang feature.
    dispose() {
        this.commands_.dispose();
        this.manager_.dispose();
    }
}

exports = Gangs;

