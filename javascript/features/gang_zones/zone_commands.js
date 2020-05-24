// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.
// @ts-check

import { Player } from 'entities/player.js';

// Implements the commands associated with gang zones, which enable gangs to modify their settings,
// purchase decorations and special effects.
export class ZoneCommands {
    manager_ = null;

    constructor(manager, playground) {
        this.manager_ = manager;

        this.playground_ = playground;
        this.playground_.addReloadObserver(this, () => this.registerTrackedCommands());

        this.registerTrackedCommands();

        // /zone
        server.commandManager.buildCommand('zone')
            .restrict(player => this.playground_().canAccessCommand(player, 'zone'))
            .build(ZoneCommands.prototype.onZoneCommand.bind(this));
    }

    // Registers the tracked commands with the Playground feature, so that
    registerTrackedCommands() {
        this.playground_().registerCommand('zone', Player.LEVEL_MANAGEMENT);
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the |player| has entered the "/zone" command. If they're in a zone that's owned
    // by a gang that they're part of, they have the ability to customize the zone here.
    async onZoneCommand(player) {

    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.playground_().unregisterCommand('zone');
        this.playground_.removeReloadObserver(this);
    }
}
