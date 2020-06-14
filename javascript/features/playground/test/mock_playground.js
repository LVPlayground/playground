// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Feature } from 'components/feature_manager/feature.js';
import PlaygroundAccessTracker from 'features/playground/playground_access_tracker.js';

// Mocked implementation of the Playground feature's API.
class MockPlayground extends Feature {
    constructor() {
        super();

        this.access_ = new PlaygroundAccessTracker();
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
    // Testing additions for the Playground feature.

    get access() { return this.access_; }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.access_.dispose();
    }
}

export default MockPlayground;
