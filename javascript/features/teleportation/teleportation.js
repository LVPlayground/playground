// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Feature = require('components/feature_manager/feature.js');
const TeleportationCommands = require('features/teleportation/teleportation_commands.js');
const TeleportationManager = require('features/teleportation/teleportation_manager.js');

// Implementation of the feature that handles teleportation in Las Venturas Playground.
class Teleportation extends Feature {
    constructor() {
        super();

        this.manager_ = new TeleportationManager();
        this.commands_ = new TeleportationCommands(this.manager_);
    }

    dispose() {
        this.commands_.dispose();
        this.manager_.dispose();
    }
}

exports = Teleportation;
