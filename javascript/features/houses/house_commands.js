// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Dialog = require('components/dialogs/dialog.js');

// This class provides the `/houses` command available to administrators to manage parts of the
// Houses feature on Las Venturas Playground. Most interaction occurs through dialogs.
class HouseCommands {
    constructor(manager, announce, economy) {
        this.manager_ = manager;

        this.announce_ = announce;
        this.economy_ = economy;

        // Command: /houses [create]
        server.commandManager.buildCommand('houses')
            .restrict(Player.LEVEL_MANAGEMENT)
            .sub('create')
                .build(HouseCommands.prototype.onHousesCreateCommand.bind(this))
            .build(HouseCommands.prototype.onHousesCommand.bind(this));
    }

    // Called when an administrator types `/houses create`. It will confirm with them whether they
    // do want to create an house at their current location, together with the price range for which
    // the house will be on offer to players.
    async onHousesCreateCommand(player) {
        const position = player.position;

        const minimumPrice = this.economy_.calculateHousePrice(position, 0 /* interiorValue */);
        const maximumPrice = this.economy_.calculateHousePrice(position, 9 /* interiorValue */);

        const confirmation =
            await Dialog.displayMessage(player, 'Create a new house location',
                                        Message.format(Message.HOUSES_CREATE_CONFIRM, minimumPrice,
                                                                                      maximumPrice),
                                        'Yes' /* leftButton */, 'No' /* rightButton */);

        if (!confirmation.response)
            return;

        await this.manager_.createLocation(player, position);

        // Announce creation of the location to other administrators.
        this.announce_.announceToAdministrators(
            Message.HOUSES_ANNOUNCE_CREATED, player.name, player.id);

        // Display a confirmation dialog to the player to inform them of their action.
        Dialog.displayMessage(player, 'Create a new house location',
                              Message.format(Message.HOUSES_CREATE_CONFIRMED),
                              'Close' /* leftButton */, '' /* rightButton */);
    }

    // Called when an administrator types the `/houses` command. Gives an overview of the available
    // options, with information on how to use the command.
    onHousesCommand(player) {
        player.sendMessage(Message.HOUSES_HEADER);
        player.sendMessage(Message.HOUSES_INFO_1);
        player.sendMessage(Message.HOUSES_INFO_2);
        player.sendMessage(Message.COMMAND_USAGE, '/houses [create]');
    }

    dispose() {
        server.commandManager.removeCommand('houses');

        this.economy_ = null;
        this.announce_ = null;

        this.manager_ = null;
    }
}

exports = HouseCommands;
