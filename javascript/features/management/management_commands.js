// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const CommandBuilder = require('components/command_manager/command_builder.js');

// The commands available to Management members are defined in this file. This includes the /mallow
// and /mdeny commands, with which access to these commands can be toggled for others.
class ManagementCommands {
    constructor() {
        this.extendedAccess_ = new Set();

        server.commandManager.buildCommand('mallow')
            .restrict(Player.LEVEL_MANAGEMENT)
            .parameters([{ name: 'target', type: CommandBuilder.PLAYER_PARAMETER, optional: true }])
            .build(ManagementCommands.prototype.mallow.bind(this));

        server.commandManager.buildCommand('mdeny')
            .restrict(Player.LEVEL_MANAGEMENT)
            .parameters([{ name: 'target', type: CommandBuilder.PLAYER_PARAMETER }])
            .build(ManagementCommands.prototype.mdeny.bind(this));

        // -----------------------------------------------------------------------------------------

        server.commandManager.buildCommand('boost')
            .restrict(ManagementCommands.prototype.hasAccess.bind(this))
            .parameters([{ name: 'target', type: CommandBuilder.PLAYER_PARAMETER },
                         { name: 'factor', type: CommandBuilder.NUMBER_PARAMETER }])
            .build(ManagementCommands.prototype.boost.bind(this));

        // -----------------------------------------------------------------------------------------

        server.playerManager.addObserver(this);
    }

    // Returns whether the |player| has access to use these commands.
    hasAccess(player) { return player.isManagement() || this.extendedAccess_.has(player); }

    // Called when the |player| disconnects from Las Venturas Playground.
    onPlayerDisconnect(player) { this.extendedAccess_.delete(player); }

    // ---------------------------------------------------------------------------------------------

    // Command: /mallow [target?]
    mallow(player, target) {
        if (!target) {
            player.sendMessage(Message.MANAGEMENT_ACCESS_HEADER);

            const accessList = Array.from(this.extendedAccess_);
            const accessNames = accessList.map(player => player.name);

            player.sendMessage(accessNames.join(', '));
            return;
        }

        if (this.extendedAccess_.has(target))
            return this.sendError(player, target.name + ' already has access.');

        this.extendedAccess_.add(target);
        this.sendSuccess(player, target.name + ' has been granted access.');
    }

    // Command: /mdeny [target]
    mdeny(player, target) {
        if (!this.extendedAccess_.has(target))
            return this.sendError(player, target.name + ' does not have access.');

        this.extendedAccess_.delete(target);
        this.sendSuccess(player, target.name + ' their access has been revoked.');
    }

    // ---------------------------------------------------------------------------------------------

    // Command: /boost [target] [factor]
    // Note that this implementation uses pawnInvoke() because the target vehicle may not be owned
    // by the JavaScript code, and the command should work for all vehicles.
    boost(player, target, factor) {
        const vehicleId = pawnInvoke('GetPlayerVehicleID', 'i', target.id);
        if (vehicleId == 0 || vehicleId > 3000)
            return this.sendError(player, target.name + ' is not driving a vehicle.');

        const velocity = pawnInvoke('GetVehicleVelocity', 'iFFF', vehicleId);
        pawnInvoke('SetVehicleVelocity', 'ifff', vehicleId, velocity[0] * factor,
                                                 velocity[1] * factor, velocity[2] * factor);

        this.sendSuccess(player, target.name + ' has been boosted.');
    }

    // ---------------------------------------------------------------------------------------------

    // Utility: Sends |message| as a success message to the |player|.
    sendSuccess(player, message) {
        player.sendMessage(Message.MANAGEMENT_SUCCESS, message);
    }

    // Utility: Sends |message| as an error message to the |player|.
    sendError(player, message) {
        player.sendMessage(Message.MANAGEMENT_ERROR, message);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.playerManager.removeObserver(this);

        this.extendedAccess_.clear();
        this.extendedAccess_ = null;

        server.commandManager.removeCommand('boost');

        server.commandManager.removeCommand('mallow');
        server.commandManager.removeCommand('mdeny');
    }
}

exports = ManagementCommands;
