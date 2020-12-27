// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Menu } from 'components/menu/menu.js';
import { VehicleCommandDelegate } from 'features/vehicles/vehicle_command_delegate.js';
import { VehicleModel } from 'entities/vehicle_model.js';

import { alert } from 'components/dialogs/alert.js';
import { confirm } from 'components/dialogs/confirm.js';

// Additional block list for vehicles that cannot be saved as house vehicles.
const kVehicleModelBlockList = new Set([
    406 /* Dumper */,
    408 /* Trashmaster */,
    427 /* Enforcer */,
    431 /* Bus */,
    432 /* Rhino */,
    444 /* Monaster */,
    486 /* Dozer */,
    524 /* Cement Truck */,
    528 /* FBI Truck */,
    532 /* Combine Harvester */,
    537 /* Freight Train */,
    538 /* Passenger Train */,
    544 /* Firetruck */,
    556 /* Monster A */,
    557 /* Monster B */,
    578 /* DFT-30 */,
    601 /* SWAT Tank */,
]);

// Responsible for allowing players to save any vehicle as their house vehicles, even when they have
// tuned and/or customised it to their liking with the server's regular abilities.
export class HouseVehicleCommands extends VehicleCommandDelegate {
    manager_ = null;

    constructor(manager) {
        super();

        this.manager_ = manager;
    }

    // Called when the |player| has executed "/v save". Decides whether they own a house, and if so,
    // whether that house has parking lots the vehicle can be saved to.
    async getVehicleSaveCommandOptions(player, target, vehicle) {
        const locations = this.manager_.getHousesForPlayer(target);
        if (!locations.length)
            return [];  // the |subject| does not own any houses

        let totalParkingLotCount = 0;
        for (const location of locations)
            totalParkingLotCount += location.parkingLotCount;

        if (!totalParkingLotCount)
            return [];  // the |subject| does not own any houses that have parking lots

        if (!this.isVehicleEligible(player, vehicle))
            return [];  // the |vehicle| is not eligible to be saved

        return [
            {
                label: 'Save as a house vehicle',
                listener: HouseVehicleCommands.prototype.onSaveHouseVehicleCommand.bind(this),
            }
        ];
    }

    // Called when the |player| would like to store the |vehicle| as one of their house vehicles. We
    // always show them a dialog with their parking lot options, and a confirmation dialog, as they
    // may by accident overwrite another one of their vehicles.
    async onSaveHouseVehicleCommand(player, target, vehicle) {
        const locations = this.manager_.getHousesForPlayer(target);
        const dialog = new Menu('House vehicle options', [
            'House',
            'Parking lot',
            'Current vehicle',
        ]);

        const options = [];

        // (1) Tally all locations and their parking spots. Add them to an array first, so that the
        // rows in the output dialog can be sorted alphabetically.
        for (const location of locations) {
            const parkingLots = new Map();

            // (a) Gather all available parking lots for the |location|.
            for (const parkingLot of location.parkingLots)
                parkingLots.set(parkingLot, null);

            // (b) Gather all vehicles assigned to those parking lots.
            for (const [ parkingLot, houseVehicle ] of location.settings.vehicles) {
                if (!parkingLots.has(parkingLot))
                    continue;  // assignment in error, ignore thie vehicle

                parkingLots.set(parkingLot, houseVehicle);
            }

            let counter = 0;

            // (c) Add all the parking lots & vehicles to the |options|.
            for (const [ parkingLot, houseVehicle ] of parkingLots) {
                options.push({
                    // Display information used for presenting the dialog.
                    house: location.settings.name,
                    counter: ++counter,
                    vehicleName: houseVehicle ? VehicleModel.getById(houseVehicle.modelId).name
                                              : null,

                    // Meta-information used when actually modifying the vehicle.
                    location, parkingLot,
                });
            }
        }

        // (2) Sort all the entries in the |options| array.
        options.sort((lhs, rhs) => {
            if (lhs.house === rhs.house)
                return lhs.counter > rhs.counter ? 1 : -1;

            return lhs.house.localeCompare(rhs.house);
        });

        // (3) Add all the entries in the |options| array to the |dialog|, so that the player can
        // select them. Some visual styling will be applied.
        for (const { house, counter, vehicleName, location, parkingLot } of options) {
            const counterLabel = `#${counter}`;
            const vehicleLabel = vehicleName ? `{FFFF00}${vehicleName}` : `{9E9E9E}vacant`;
            const listener = HouseVehicleCommands.prototype.handleSaveHouseVehicleFlow.bind(
                this, player, vehicle, location, parkingLot, vehicleName);

            dialog.addItem(house, counterLabel, vehicleLabel, listener);
        }

        await dialog.displayForPlayer(player);
    }

    // Triggered when the |player| has selected which |parkingLot| the |vehicle| should be stored
    // to. The |vehicleName| may or may not be populated with the existing vehicle name.
    async handleSaveHouseVehicleFlow(player, vehicle, location, parkingLot, vehicleName) {
        let confirmation = null;

        if (vehicleName) {
            confirmation = confirm(player, {
                title: 'House vehicle options',
                message: `Are you sure that you want to overwrite the ${vehicleName}?`
            });
        } else {
            confirmation = confirm(player, {
                title: 'House vehicle options',
                message: `Are you sure that you want to save this ${vehicle.model.name}?`,
            });
        }

        // If the |player| does not confirm saving the vehicle, bail out now.
        if (!await confirmation)
            return;

        await this.manager_.storeVehicle(location, parkingLot, vehicle);

        return await alert(player, {
            title: 'House vehicle options',
            message: `Ace! The ${vehicle.model.name} has been stored for you.`,
        });
    }

    // Called when the |player| wishes to delete the vehicle they're driving. If the |vehicle| is
    // associated with a house vehicle, we will want to manage deletion ourselves.
    async onVehicleDeleteCommand(player, target, vehicle) {
        const result = this.manager_.vehicleController.findLocationForVehicle(vehicle);
        if (!result)
            return false;

        const { location, houseVehicle } = result;

        // (1) Unless the |player| is an administrator, require the |location| to be owned by the
        // given |target| to make sure players don't remove each others vehicles.
        if (!player.isAdministrator() && location.settings.ownerId !== target.account.userId) {
            await alert(player, {
                title: 'House vehicle management',
                message: `This ${vehicle.model.name} is owned by ${location.settings.ownerName}, ` +
                         `you cannot delete it!`
            });

            return true;  // handled
        }

        // (2) Ask the |player| if they're really certain about wanting to delete this vehicle.
        const confirmation = await confirm(player, {
            title: 'House vehicle management',
            message: `Are you sure that you want to delete this ${vehicle.model.name}\n` +
                     `that's owned by ${location.settings.ownerName}? This cannot be reversed.`
        });

        if (!confirmation)
            return true;  // handled
        
        await this.manager_.storeVehicle(location, houseVehicle.parkingLot, /* vehicle= */ null);
        await alert(player, {
            title: 'House vehicle management',
            message: `Gotcha. The ${vehicle.model.name} has been removed.`,
        });

        return true;  // handled
    }

    // Returns whether the |vehicle| is eligible to be saved as a house vehicle. We don't allow
    // planes or other weird vehicles, although Management members are able to override.
    isVehicleEligible(player, vehicle) {
        if (player.isManagement())
            return true;

        const vehicleModel = vehicle.model;
        if (!vehicleModel)
            return false;

        if (kVehicleModelBlockList.has(vehicleModel.id))
            return false;

        return !vehicleModel.isAirborne() &&
               !vehicleModel.isRemoteControllable() &&
               !vehicleModel.isTrailer();
    }
}
