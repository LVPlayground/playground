// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const CommandBuilder = require('components/command_manager/command_builder.js');
const Dialog = require('components/dialogs/dialog.js');
const IdentityBeam = require('features/houses/utils/identity_beam.js');
const InteriorList = require('features/houses/utils/interior_list.js');
const InteriorSelector = require('features/houses/utils/interior_selector.js');
const Menu = require('components/menu/menu.js');
const ParkingLotCreator = require('features/houses/utils/parking_lot_creator.js');
const ParkingLotRemover = require('features/houses/utils/parking_lot_remover.js');

// Maximum number of milliseconds during which the identity beam should be displayed.
const IDENTITY_BEAM_DISPLAY_TIME_MS = 60000;

// This class provides the `/house` command available to administrators to manage parts of the
// Houses feature on Las Venturas Playground. Most interaction occurs through dialogs.
class HouseCommands {
    constructor(manager, announce, economy) {
        this.manager_ = manager;

        this.announce_ = announce;
        this.economy_ = economy;

        this.parkingLotCreator_ = new ParkingLotCreator();
        this.parkingLotRemover_ = new ParkingLotRemover();

        // Command: /house [buy/cancel/create/modify/remove/save/sell]
        server.commandManager.buildCommand('house')
            .restrict(Player.LEVEL_MANAGEMENT)
            .sub('buy')
                .build(HouseCommands.prototype.onHouseBuyCommand.bind(this))
            .sub('cancel')
                .build(HouseCommands.prototype.onHouseCancelCommand.bind(this))
            .sub('create')
                .restrict(Player.LEVEL_ADMINISTRATOR)
                .build(HouseCommands.prototype.onHouseCreateCommand.bind(this))
            .sub('modify')
                .restrict(Player.LEVEL_ADMINISTRATOR)
                .build(HouseCommands.prototype.onHouseModifyCommand.bind(this))
            .sub('remove')
                .restrict(Player.LEVEL_ADMINISTRATOR)
                .parameters([{ name: 'id', type: CommandBuilder.NUMBER_PARAMETER }])
                .build(HouseCommands.prototype.onHouseRemoveCommand.bind(this))
            .sub('save')
                .restrict(Player.LEVEL_ADMINISTRATOR)
                .build(HouseCommands.prototype.onHouseSaveCommand.bind(this))
            .sub('sell')
                .build(HouseCommands.prototype.onHouseSellCommand.bind(this))
            .build(HouseCommands.prototype.onHouseCommand.bind(this));
    }

    // Called when a player types the `/house buy` command to start purchasing a house. They must be
    // standing in a house entrance in order for the command to work.
    async onHouseBuyCommand(player) {
        const location = this.manager_.getCurrentLocationForPlayer(player);
        if (!location) {
            player.sendMessage(Message.HOUSE_BUY_NO_LOCATION);
            return;
        }

        const currentHouse = this.manager_.getHouseForPlayer(player);
        if (currentHouse) {
            player.sendMessage(Message.HOUSE_BUY_NO_MULTIPLE);
            return;
        }

        if (!location.isAvailable()) {
            player.sendMessage(Message.HOUSE_BUY_NOT_AVAILABLE, location.owner);
            return;
        }

        // |location| is available for purchase, and the |player| does not have a house yet.

        const interiorList = InteriorList.forEconomy(this.economy_(), location);
        const interior = await InteriorSelector.select(player, 12500000, interiorList);

        // TODO: Verify the amount of money of |player| again.

        console.log(interior);
    }

    // Called when a |player| types the `/house cancel` command in response to an interactive
    // operation, for instance whilst adding a parking lot.
    onHouseCancelCommand(player) {
        if (this.parkingLotCreator_.isSelecting(player))
            this.parkingLotCreator_.cancelSelection(player);
        else if (this.parkingLotRemover_.isSelecting(player))
            this.parkingLotRemover_.cancelSelection(player);
        else
            player.sendMessage(Message.HOUSE_CANCEL_UNKNOWN);
    }

    // Called when an administrator types `/house create`. It will confirm with them whether they
    // do want to create a house at their current location, together with the price range for which
    // the house will be on offer to players.
    async onHouseCreateCommand(player) {
        const position = player.position;

        // Certain areas are considered to be of high strategic value, and only allow for limited
        // residential activity. Houses should be maintained by players elsewhere.
        if (this.economy_().isResidentialExclusionZone(position)) {
            const rightButton = player.isManagement() ? 'Override' : '';
            const confirmation =
                await Dialog.displayMessage(
                    player, 'Create a new house location',
                    Message.format(Message.HOUSE_CREATE_RESIDENTIAL_EXCLUSION_ZONE),
                    'Close' /* leftButton */, rightButton);

            if (!player.isManagement() || confirmation.response)
                return;
        }

        const minimumPrice = this.economy_().calculateHousePrice(position, 0 /* parkingLotCount */,
                                                                 0 /* interiorValue */);
        const maximumPrice = this.economy_().calculateHousePrice(position, 0 /* parkingLotCount */,
                                                                 9 /* interiorValue */);

        const confirmation =
            await Dialog.displayMessage(player, 'Create a new house location',
                                        Message.format(Message.HOUSE_CREATE_CONFIRM, minimumPrice,
                                                                                     maximumPrice),
                                        'Yes' /* leftButton */, 'No' /* rightButton */);

        if (!confirmation.response)
            return;

        await this.manager_.createLocation(player, position);

        // Announce creation of the location to other administrators.
        this.announce_().announceToAdministrators(
            Message.HOUSE_ANNOUNCE_CREATED, player.name, player.id);

        // Display a confirmation dialog to the player to inform them of their action.
        Dialog.displayMessage(player, 'Create a new house location',
                              Message.format(Message.HOUSE_CREATE_CONFIRMED),
                              'Close' /* leftButton */, '' /* rightButton */);
    }

    // Called when an administrator types the `/house modify` command to change settings for the
    // house closest to their location, allowing them to, for example, add or remove parking lots.
    async onHouseModifyCommand(player) {
        const closestLocation =
            await this.manager_.findClosestLocation(player, 15 /* maximumDistance */);

        if (!closestLocation) {
            player.sendMessage(Message.HOUSE_MODIFY_NONE_NEAR);
            return;
        }

        // Create a beam for |player| at the house's entrance to clarify what's being edited.
        const identityBeam = new IdentityBeam(closestLocation.position.translate({ z: -10 }), {
            timeout: IDENTITY_BEAM_DISPLAY_TIME_MS,
            player: player
        });

        const menu = new Menu('How do you want to modify this house?');

        menu.addItem('Add a parking lot', async(player) => {
            const message =
                Message.format(Message.HOUSE_PARKING_LOT_ADD, this.parkingLotCreator_.maxDistance);

            await Dialog.displayMessage(
                player, 'Add a parking lot', message, 'Close', '' /* rightButton */);

            const parkingLot = await this.parkingLotCreator_.select(player, closestLocation);
            if (!parkingLot)
                return;

            await this.manager_.createLocationParkingLot(player, closestLocation, parkingLot);

            // TODO: Should we announce this to the other administrators? We really need
            // announcement channels to deal with the granularity of messages.

            await Dialog.displayMessage(player, 'Add a parking lot',
                                        Message.format(Message.HOUSE_PARKING_LOT_ADDED),
                                        'Close' /* leftButton */, '' /* rightButton */);
        });

        const removeParkingLotTitle =
            'Remove a parking lot ({FFFF00}' + closestLocation.parkingLotCount + '{FFFFFF})';

        menu.addItem(removeParkingLotTitle, async(player) => {
            if (!closestLocation.parkingLotCount) {
                await Dialog.displayMessage(player, 'Remove a parking lot',
                                            Message.format(Message.HOUSE_PARKING_LOT_NONE),
                                            'Close' /* leftButton */, '' /* rightButton */);
                return;
            }

            await Dialog.displayMessage(
                player, 'Remove a parking lot', Message.HOUSE_PARKING_LOT_REMOVE,
                'Close' /* leftButton */, '' /* rightButton */);

            const parkingLot = await this.parkingLotRemover_.select(player, closestLocation);
            if (!parkingLot)
                return;

            await this.manager_.removeLocationParkingLot(closestLocation, parkingLot);

            // TODO: Should we announce this to the other administrators? We really need
            // announcement channels to deal with the granularity of messages.

            await Dialog.displayMessage(player, 'Remove a parking lot',
                                        Message.format(Message.HOUSE_PARKING_LOT_REMOVED),
                                        'Close' /* leftButton */, '' /* rightButton */);
        });

        // TODO: Add the ability to evict the occupant?

        menu.addItem('Delete the location', async(player) => {
            const confirmation =
                await Dialog.displayMessage(player, 'Delete the house location',
                                            Message.format(Message.HOUSE_MODIFY_DELETE_CONFIRM),
                                            'Yes' /* leftButton */, 'No' /* rightButton */);

            if (!confirmation.response)
                return;

            await this.manager_.removeLocation(closestLocation);

            // Announce creation of the location to other administrators.
            this.announce_().announceToAdministrators(
                Message.HOUSE_ANNOUNCE_DELETED, player.name, player.id, closestLocation.id);

            // Display a confirmation dialog to the player to inform them of their action.
            Dialog.displayMessage(player, 'Delete the house location',
                                  Message.format(Message.HOUSE_MODIFY_DELETE_CONFIRMED),
                                  'Close' /* leftButton */, '' /* rightButton */);
        });

        await menu.displayForPlayer(player);

        // Remove the identity beam that was displayed for this house.
        identityBeam.dispose();
    }

    // Called when a |player| types the `/house remove` command with the given |id|. Will find the
    // in-progress interactive operation that should receive this value.
    onHouseRemoveCommand(player, id) {
        if (this.parkingLotRemover_.isSelecting(player))
            this.parkingLotRemover_.confirmSelection(player, id);
        else
            player.sendMessage(Message.HOUSE_REMOVE_UNKNOWN);
    }

    // Called when a |player| types the `/house save` command in response to an interactive
    // operation, for instance whilst adding a parking lot.
    onHouseSaveCommand(player) {
        if (this.parkingLotCreator_.isSelecting(player))
            this.parkingLotCreator_.confirmSelection(player);
        else
            player.sendMessage(Message.HOUSE_SAVE_UNKNOWN);
    }

    // Called when a |player| types the `/house sell` command to sell their house. They don't have
    // to be in the house when typing this, but they will have to confirm the transaction.
    async onHouseSellCommand(player) {
        const location = await this.manager_.findClosestLocation(player);

        const interiorList = InteriorList.forEconomy(this.economy_(), location);
        const interior = await InteriorSelector.select(player, 12500000, interiorList);

        console.log(interior);

    }

    // Called when an administrator types the `/house` command. Gives an overview of the available
    // options, with information on how to use the command, depending on the |player|'s level.
    onHouseCommand(player) {
        player.sendMessage(Message.HOUSE_HEADER);
        player.sendMessage(Message.HOUSE_INFO_1);
        player.sendMessage(Message.HOUSE_INFO_2);

        if (player.isAdministrator())
            player.sendMessage(Message.COMMAND_USAGE, '/house [buy/create/modify/sell]');
        else
            player.sendMessage(Message.COMMAND_USAGE, '/house [buy/sell]');
    }

    dispose() {
        server.commandManager.removeCommand('house');

        this.parkingLotCreator_.dispose();
        this.parkingLotCreator_ = null;

        this.parkingLotRemover_.dispose();
        this.parkingLotRemover_ = null;

        this.economy_ = null;
        this.announce_ = null;

        this.manager_ = null;
    }
}

exports = HouseCommands;
