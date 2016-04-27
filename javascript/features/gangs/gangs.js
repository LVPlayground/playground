// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Feature = require('components/feature_manager/feature.js');
const GangManager = require('features/gangs/gang_manager.js');

// Implementation of the gangs feature. A gang is a group of players that fight together under a
// collaborative name. They get a shared bank account, have a private-ish group chat available to
// them and will be displayed on the Gangs section of the website.
class Gangs extends Feature {
    constructor() {
        super();

        this.manager_ = new GangManager(server.database);
    }

    // Cleans up all routines and state stored as part of the gang feature.
    dispose() {
        this.manager_.dispose();
    }
}

exports = Gangs;

