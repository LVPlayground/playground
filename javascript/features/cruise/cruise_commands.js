// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// It needs to be possible for admins to start up and end the cruise. By this command we provide this functionality.
export class CruiseCommands {
    constructor(manager) {
        this.manager_ = manager;

        server.deprecatedCommandManager.buildCommand('cruise')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .sub('start')
                .build(CruiseCommands.prototype.onCruiseStartCommand.bind(this))
            .sub('stop')
                .build(CruiseCommands.prototype.onCruiseStopCommand.bind(this))
            .build(CruiseCommands.prototype.onCruiseCommand.bind(this));
    }

    onCruiseCommand(player) {
        player.sendMessage(Message.CRUISE_USAGE);
    }

    onCruiseStartCommand(player) {
        this.manager_.start(player);
    }

    onCruiseStopCommand(player) {
        this.manager_.stop(player);
    }

    // Cleans up the state created by this class, i.e. unregisters the commands.
    dispose() {
        server.deprecatedCommandManager.removeCommand('cruise');
    }
}
