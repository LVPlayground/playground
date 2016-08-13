// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ParkingLotSelector = require('features/houses/utils/parking_lot_selector.js');

// Maximum distance, in units, at which parking lots may be created around a house location.
const MAXIMUM_PARKING_LOT_DISTANCE = 150;

// Parking lot selector intended to allow administrators to *create* parking lots for a location.
class ParkingLotSelectorCreate extends ParkingLotSelector {
    async doSelection(player, location) {
        const position = this.getCurrentVehiclePosition(player);
        const rotation = this.getCurrentVehicleRotation(player);

        if (!position || !rotation) {
            const dialog =
                await this.displayError(player, Message.HOUSE_PARKING_LOT_NOT_IN_VEHICLE);

            if (!dialog.response)
                return [ ParkingLotSelector.ACTION_ABORT ];

            return [ ParkingLotSelector.ACTION_RETRY ];
        }

        const distance = position.distanceTo(location.position);
        if (distance > MAXIMUM_PARKING_LOT_DISTANCE) {
            const dialog =
                await this.displayError(player, Message.HOUSE_PARKING_LOT_TOO_FAR,
                                        MAXIMUM_PARKING_LOT_DISTANCE, distance);

            if (!dialog.response)
                return [ ParkingLotSelector.ACTION_ABORT ];

            return [ ParkingLotSelector.ACTION_RETRY ];
        }

        // Success: the location of a parking lot has been chosen.
        return [ ParkingLotSelector.ACTION_SUCCESS, { position, rotation } ];
    }

    // Gets the maximum distance between a house' entrance and its parking lots.
    get maxDistance() {
        return MAXIMUM_PARKING_LOT_DISTANCE;
    }

    // ---------------------------------------------------------------------------------------------
    // Private functions

    // Returns the position of the vehicle the |player| currently is in, or NULL otherwise.
    getCurrentVehiclePosition(player) {
        const vehicleId = pawnInvoke('GetPlayerVehicleID', 'i', player.id);
        if (vehicleId)
            return new Vector(...pawnInvoke('GetVehiclePos', 'iFFF', vehicleId));

        return null;
    }

    // Returns the rotation of the vehicle the |player| currently is in, or NULL otherwise.
    getCurrentVehicleRotation(player) {
        const vehicleId = pawnInvoke('GetPlayerVehicleID', 'i', player.id);
        if (vehicleId)
            return pawnInvoke('GetVehicleZAngle', 'iF', vehicleId);

        return null;
    }
}

exports = ParkingLotSelectorCreate;
