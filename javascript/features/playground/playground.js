// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Feature = require('components/feature_manager/feature.js');
const PlaygroundCommands = require('features/playground/playground_commands.js');
const PlaygroundManager = require('features/playground/playground_manager.js');

// Implementation of the feature that contains a number of options and features giving Las Venturas
// Playground its unique identity.
class Playground extends Feature {
    constructor() {
        super();

        // Used for announcing changes in feature availability to players.
        const announce = this.defineDependency('announce');

        this.manager_ = new PlaygroundManager();
        this.commands_ = new PlaygroundCommands(this.manager_, announce);

        // Activate the features that should be activated by default.
        this.manager_.initialize();
    }

    // ---------------------------------------------------------------------------------------------
    // This feature has no public API.
    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.commands_.dispose();
    }
}

exports = Playground;
