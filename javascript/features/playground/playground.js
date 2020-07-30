// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Feature } from 'components/feature_manager/feature.js';
import { PlaygroundAccessTracker } from 'features/playground/playground_access_tracker.js';
import { PlaygroundCommands } from 'features/playground/playground_commands.js';
import { PlaygroundManager } from 'features/playground/playground_manager.js';
import { PlaygroundNuwaniCommands } from 'features/playground/playground_nuwani_commands.js';

// Implementation of the feature that contains a number of options and features giving Las Venturas
// Playground its unique identity.
export default class Playground extends Feature {
    access_ = null;
    announce_ = null;
    commands_ = null;
    manager_ = null;
    nuwani_ = null;
    nuwaniCommands_ = null;

    constructor() {
        super();

        // Used for announcing changes in feature availability to players.
        this.announce_ = this.defineDependency('announce');

        // Used for controlling the message filter, as well as server-wide communication.
        const communication = this.defineDependency('communication');

        // Used for distributing messages to Nuwani, where applicable, as well as providing the
        // !lvp command to people on IRC and Discord.
        this.nuwani_ = this.defineDependency('nuwani');
        this.nuwani_.addReloadObserver(this, () => this.initializeNuwaniCommands());

        // The Playground feature provides an interface that allows Managers to amend the server's
        // statistics. We closely integrate with that feature.
        const settings = this.defineDependency('settings');

        this.access_ = new PlaygroundAccessTracker();
        this.manager_ = new PlaygroundManager(settings);
        this.commands_ =
            new PlaygroundCommands(this.access_, this.announce_, communication, this.nuwani_,
                                   settings);

        // Both the PlaygroundManager and PlaygroundCommands require additional initialization that
        // will be done lazily by the tests that need it, in order to avoid slowing down all tests.
        if (!server.isTest()) {
            this.manager_.initialize();
            this.commands_.loadCommands();
        }

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
    // ---------------------------------------------------------------------------------------------

    // Returns whether the |player| is able to use |command|. This considers the command's default
    // level, as well as any overrides that might have been created.
    canAccessCommand(player, command) {
        return this.access_.canAccessCommand(command, player);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.nuwaniCommands_.dispose();
        this.nuwaniCommands_ = null;

        this.commands_.dispose();
        this.commands_ = null;

        this.manager_.dispose();
        this.manager_ = null;

        this.access_.dispose();
        this.access_ = null;

        this.announce_ = null;

        this.nuwani_.removeReloadObserver(this);
        this.nuwani_ = null;
    }
}
