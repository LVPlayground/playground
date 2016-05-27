// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const CommandBuilder = require('components/command_manager/command_builder.js');
const Vector = require('base/vector.js');

// For some purposes it could come in handy to know something about your own position and the
// direction looking in. Some small positioning-related commands are for that defined in here.
class PositioningCommands {
    constructor() {
        server.commandManager.buildCommand('getpos')
            .build(PositioningCommands.prototype.onGetPosCommand.bind(this));

        server.commandManager.buildCommand('up')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([{ name: 'distance', type: CommandBuilder.NUMBER_PARAMETER }])
            .build(PositioningCommands.prototype.onUpCommand.bind(this));
    }

    onGetPosCommand(player) {
        const playerPosition = player.position;
        const playerFacingAngle = player.facingAngle;

        player.sendMessage(
            Message.POSITIONING_CURRENT_POSITION, playerPosition.x, playerPosition.y,
            playerPosition.z, playerFacingAngle);
    }

    onUpCommand(player, distance) {
        if (player.isInVehicle()) {
            const playerVehiclePosition = player.currentVehicle.position;
            player.currentVehicle.position =
                new Vector(playerVehiclePosition.x, playerVehiclePosition.y,
                           playerVehiclePosition.z + distance);
        }
        else {
            const playerPosition = player.position;
            player.position =
                new Vector(playerPosition.x, playerPosition.y,
                           playerPosition.z + distance);
        }
    }

    // Cleans up the state created by this class, i.e. unregisters the commands.
    dispose() {
        server.commandManager.removeCommand('getpos');
    }
}

exports = PositioningCommands;
