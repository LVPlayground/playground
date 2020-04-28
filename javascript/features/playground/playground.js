// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Feature from 'components/feature_manager/feature.js';
import PlaygroundAccessTracker from 'features/playground/playground_access_tracker.js';
import PlaygroundCommands from 'features/playground/playground_commands.js';
import PlaygroundManager from 'features/playground/playground_manager.js';
import { PlaygroundNuwaniCommands } from 'features/playground/playground_nuwani_commands.js';

// Implementation of the feature that contains a number of options and features giving Las Venturas
// Playground its unique identity.
class Playground extends Feature {
    constructor() {
        super();

        // Used for announcing changes in feature availability to players.
        this.announce_ = this.defineDependency('announce');

        // Used for distributing messages to Nuwani, where applicable.
        this.nuwani_ = this.defineDependency('nuwani');
        this.nuwani_.addReloadObserver(this, () => this.initializeNuwaniCommands());

        // The Playground feature provides an interface in the mutable settings.
        const settings = this.defineDependency('settings');

        this.access_ = new PlaygroundAccessTracker();

        this.manager_ = new PlaygroundManager(settings);

        this.commands_ =
            new PlaygroundCommands(this.access_, this.announce_, this.nuwani_, settings);
        this.commands_.loadCommands();

        // Activate the features that should be activated by default.
        this.manager_.initialize();
        this.initializeNuwaniCommands();
    }

    // Initializes the Nuwani commands part of the Playground feature. In a separate method because
    // Nuwani may have to be reloaded during server runtime.
    initializeNuwaniCommands() {
        this.nuwaniCommands_ =
            new PlaygroundNuwaniCommands(this.announce_, this.nuwani_, this.manager_);
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
        this.nuwaniCommands_.dispose();

        this.commands_.dispose();
        this.manager_.dispose();

        this.access_.dispose();
    }
}

export default Playground;
