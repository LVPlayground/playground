// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Menu } from 'components/menu/menu.js';
import { VehicleCommandDelegate } from 'features/vehicles/vehicle_command_delegate.js';
import { VehicleModel } from 'entities/vehicle_model.js';

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
    async getVehicleSaveCommandOptions(player) {
        const locations = this.manager_.getHousesForPlayer(player);
        if (!locations.length)
            return [];  // the |player| does not own any houses

        let totalParkingLotCount = 0;
        for (const location of locations)
            totalParkingLotCount += location.parkingLotCount;

        if (!totalParkingLotCount)
            return [];  // the |player| does not own any houses that have parking lots

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
    async onSaveHouseVehicleCommand(player, vehicle) {
        const locations = this.manager_.getHousesForPlayer(player);
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
                    vehicle: houseVehicle ? VehicleModel.getById(houseVehicle.modelId).name
                                          : null,

                    // Meta-information used when actually modifying the vehicle.
                    location, parkingLot, houseVehicle,
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
        for (const { house, counter, vehicle, location, parkingLot, houseVehicle } of options) {
            const counterLabel = `#${counter}`;
            const vehicleLabel = vehicle ? `{FFFF00}${vehicle}` : `{9E9E9E}vacant`;
            const listener = HouseVehicleCommands.prototype.handleSaveHouseVehicleFlow.bind(
                this, player, vehicle, location, parkingLot, houseVehicle);

            dialog.addItem(house, counterLabel, vehicleLabel, listener);
        }

        await dialog.displayForPlayer(player);
    }

    // Triggered when the |player| has selected which |parkingLot| the |vehicle| should be stored
    // to. The |houseVehicle| may or may not be filled with another vehicle already.
    async handleSaveHouseVehicleFlow(player, vehicle, location, parkingLot, houseVehicle) {
        // TODO...
    }
}
