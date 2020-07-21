// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Feature } from 'components/feature_manager/feature.js';
import { PlayerCommandRegistry } from 'features/player_commands/player_command_registry.js';

// Provides the implementations of the "/my" and "/p" commands available for players and admins
// alike. This groups together a lot of common functionality, so this feature is expected to have a
// significant number of dependencies on other features.
export default class PlayerCommands extends Feature {
    registry_ = null;

    constructor() {
        super();

        // Miscellaneous dependencies required by a subset of the available commands.
        const announce = this.defineDependency('announce');
        const finance = this.defineDependency('finance');
        const limits = this.defineDependency('limits');

        // The PlayerCommandRegistry loads and keeps track of the individual available commands,
        // which will be loaded from files through a globbing pattern.
        this.registry_ = new PlayerCommandRegistry(announce, finance, limits);

        // Initialize immediately when running the production server, otherwise lazily.
        if (!server.isTest())
            this.registry_.initialize();
    }

    dispose() {
        this.registry_.dispose();
        this.registry_ = null;
    }
}
