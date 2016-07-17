// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Feature = require('components/feature_manager/feature.js');
const ManagementCommands = require('features/management/management_commands.js');

// The Las Venturas Playground Management are, in a nutshell, assholes. This feature adds a series
// of commands available just for them, and those added to a temporary whitelist.
class Management extends Feature {
    constructor() {
        super();

        this.commands_ = new ManagementCommands();
    }

    dispose() {
        this.commands_.dispose();
    }
}

exports = Management;
