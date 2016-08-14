// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Implements a series of commands related to location handling in Las Venturas Playground.
class LocationCommands {
    constructor(interiorManager) {
        this.interiorManager_ = interiorManager;

        // Command: /bugged
        server.commandManager.buildCommand('bugged')
            .build(LocationCommands.prototype.onBuggedCommand.bind(this))
    }

    // Called when a player types `/bugged`. Since interior handling may be a bit whacky for a
    // little while, this will tell us about better facing angles.
    onBuggedCommand(player) {
        const marker = this.interiorManager_.getLatestMarkerForPlayer(player);
        if (!marker) {
            player.sendMessage(Message.INTERIOR_FACING_ANGLE_UNKNOWN);
            return;
        }

        const rotation = Math.round(player.rotation);
        const position = player.position;

        console.log('[INTBUG] ' + player.name + ' reports "' + marker + '": ' + rotation + ' at ' +
                    position.x + ', ' + position.y + ', ' + position.z);

        player.sendMessage(Message.INTERIOR_FACING_ANGLE_THANKS);
    }

    dispose() {

    }
}

exports = LocationCommands;
