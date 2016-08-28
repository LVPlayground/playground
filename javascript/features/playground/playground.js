// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Feature = require('components/feature_manager/feature.js');
const PlaygroundAccessTracker = require('features/playground/playground_access_tracker.js');
const PlaygroundCommands = require('features/playground/playground_commands.js');
const PlaygroundManager = require('features/playground/playground_manager.js');

// Implementation of the feature that contains a number of options and features giving Las Venturas
// Playground its unique identity.
class Playground extends Feature {
    constructor() {
        super();

        // Used for announcing changes in feature availability to players.
        const announce = this.defineDependency('announce', true /* isFunctional */);

        this.access_ = new PlaygroundAccessTracker();

        this.manager_ = new PlaygroundManager();
        this.commands_ = new PlaygroundCommands(this.manager_, this.access_, announce);

        // Activate the features that should be activated by default.
        this.manager_.initialize();
    }

    // ---------------------------------------------------------------------------------------------
    // Public API of the Playground feature.

    // Registers the |command| as one access for which can be controlled with `/lvp access`.
    registerCommand(command, defaultLevel) {
        this.access_.registerCommand(command, defaultLevel);
    }

    // Returns whether the |player| is able to use |command|. The |command| must have been
    // registered with the Playground feature in the past.
    canAccessCommand(player, command) {
        return this.access_.canAccessCommand(command, player);
    }

    // Unregisters the |command| from the access tracker.
    unregisterCommand(command) {
        this.access_.unregisterCommand(command);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.commands_.dispose();
        this.manager_.dispose();

        this.access_.dispose();
    }
}

exports = Playground;
