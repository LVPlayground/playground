// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Responsible for providing the commands associated with vehicles. Both players and administrators
// can create vehicles. Administrators can save, modify and delete vehicles as well.
class VehicleCommands {
    constructor(manager, playground) {
        this.manager_ = manager;

        this.playground_ = playground;
        this.playground_.addReloadObserver(
            this, VehicleCommands.prototype.registerTrackedCommands);

        this.registerTrackedCommands(playground());

        // Command: /v
        server.commandManager.buildCommand('v')
            .restrict(player => this.playground_().canAccessCommand(player, 'v'))
            .build(VehicleCommands.prototype.onVehicleCommand.bind(this));
    }

    // ---------------------------------------------------------------------------------------------

    // Called when a player executes `/v` without any arguments.
    onVehicleCommand(player) {
        player.sendMessage('This feature has not yet been implemented.');
    }

    // ---------------------------------------------------------------------------------------------

    // Registers the privileged commands with the `/lvp access` feature.
    registerTrackedCommands(playground) {
        playground.registerCommand('v', Player.LEVEL_ADMINISTRATOR);
    }

    // Drops registrations for the privileged commands.
    unregisterTrackedCommands(playground) {
        playground.unregisterCommand('v');
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.unregisterTrackedCommands(this.playground_());

        server.commandManager.removeCommand('v');
    }
}

exports = VehicleCommands;
