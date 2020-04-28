// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Feature from 'components/feature_manager/feature.js';

import { NuwaniCommands } from 'features/punishments/nuwani_commands.js';

// Provides a series of commands related to punishing players.
export default class Punishments extends Feature {
    nuwani_ = null;

    nuwaniCommands_ = null;

    constructor() {
        super();

        // Actions will have to be reported to other administrators.
        this.announce_ = this.defineDependency('announce');

        // This feature provides commands to Nuwani, so will have to depend on it.
        this.nuwani_ = this.defineDependency('nuwani');
        this.nuwani_.addReloadObserver(this, () => this.initializeNuwaniCommands());

        this.initializeNuwaniCommands();
    }

    // Initializes the Nuwani commands. Done in a separate method to be able to cope with the
    // `nuwani` feature reloading itself.
    initializeNuwaniCommands() {
        this.nuwaniCommands_ = new NuwaniCommands(
            this.nuwani_().commandManager, this.announce_);
    }

    dispose() {
        this.nuwaniCommands_.dispose();
        this.nuwaniCommands_ = null;
    }
}
