// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const CommandBuilder = require('components/command_manager/command_builder.js');
const Vector = require('base/vector.js');

// For some purposes it could come in handy to know something about your own position and the
// direction looking in. Some small positioning-related commands are for that defined in here.
class PositioningCommands {
    constructor() {
        server.commandManager.buildCommand('pos')
            .sub(CommandBuilder.NUMBER_PARAMETER) // x
                .restrict(Player.LEVEL_ADMINISTRATOR)
                .parameters([{ name: 'y', type: CommandBuilder.NUMBER_PARAMETER },
                             { name: 'z', type: CommandBuilder.NUMBER_PARAMETER }])
                .build(PositioningCommands.prototype.onSetPosCommand.bind(this))
            .build(PositioningCommands.prototype.onPosCommand.bind(this));

        server.commandManager.buildCommand('up')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([{ name: 'distance', type: CommandBuilder.NUMBER_PARAMETER }])
            .build(PositioningCommands.prototype.onUpCommand.bind(this));
    }

    onPosCommand(player) {
        const playerPosition = player.position;
        const playerFacingAngle = player.facingAngle;

        player.sendMessage(
            Message.POSITIONING_CURRENT_POSITION, playerPosition.x, playerPosition.y,
            playerPosition.z, playerFacingAngle);

        if (player.level == Player.LEVEL_ADMINISTRATOR)
            player.sendMessage(Message.POSITIONING_OTHER_USAGE_POS);
    }

    onSetPosCommand(player, x, y, z) {
        player.position = new Vector(x, y, z);
    }

    // Dirty hack to get position of current non-javascript created vehicle of player
    getPositionOfVehicle(vehicleId) {
        return new Vector(...pawnInvoke('GetVehiclePos', 'iFFF', vehicleId));
    }

    // Dirty hack to set that position of current non-javascript created vehicle of player
    setPositionOfVehicle(vehicleId, positions) {
        pawnInvoke('SetVehiclePos', 'ifff', vehicleId, positions.x, positions.y,
                   positions.z);
    }

    onUpCommand(player, distance) {
        if (player.isInVehicle()) {
            const playerVehicleId = pawnInvoke('GetPlayerVehicleID', 'i', player.id);

            const playerVehiclePosition = this.getPositionOfVehicle(playerVehicleId);
            this.setPositionOfVehicle(playerVehicleId,
                new Vector(playerVehiclePosition.x, playerVehiclePosition.y,
                           playerVehiclePosition.z + distance));
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
        server.commandManager.removeCommand('pos');
        server.commandManager.removeCommand('up');
    }
}

exports = PositioningCommands;
