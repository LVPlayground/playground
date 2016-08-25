// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Dialog = require('components/dialogs/dialog.js');

// Maximum distance, in units, at which parking lots may be created around a house location.
const MAXIMUM_PARKING_LOT_DISTANCE = 150;

// Utility function allowing administrators to select a location at which a parking lot should be
// created for a given location. There is a maximum distance at which they can be created.
class ParkingLotCreator {
    constructor() {
        this.activeSelectors_ = new WeakMap();

        // Observe disconnecting players so that we can cancel their creator.
        server.playerManager.addObserver(this);
    }

    // Gets the maximum distance between a house' entrance and its parking lots.
    get maxDistance() {
        return MAXIMUM_PARKING_LOT_DISTANCE;
    }

    // Returns whether |player| is currently selecting a parking lot.
    isSelecting(player) {
        return this.activeSelectors_.has(player);
    }

    // Creates a parking lot selector for |player| for |location|. The player should have been
    // displayed usage instructions for the selector.
    async select(player, location) {
        do {
            const finishedPromise = new Promise(resolve =>
                this.activeSelectors_.set(player, { cancel: resolve }));

            const finishedReason = await finishedPromise;

            this.activeSelectors_.delete(player);

            // Bail out if the location wasn't confirmed by the player.
            if (finishedReason != ParkingLotCreator.REASON_CONFIRMED)
                return null;

            const position = this.getCurrentVehiclePosition(player);
            const rotation = this.getCurrentVehicleRotation(player);

            if (!position || !rotation) {
                const dialog =
                    await this.displayError(player, Message.HOUSE_PARKING_LOT_NOT_IN_VEHICLE);

                if (!dialog.response)
                    return null;

                continue;
            }

            const distance = position.distanceTo(location.position);
            if (distance > MAXIMUM_PARKING_LOT_DISTANCE) {
                const dialog =
                    await this.displayError(player, Message.HOUSE_PARKING_LOT_TOO_FAR,
                                            MAXIMUM_PARKING_LOT_DISTANCE, distance);

                if (!dialog.response)
                    return null;

                continue;
            }

            const interiorId = player.interiorId;

            // Success: the location of a parking lot has been chosen.
            return { position, rotation, interiorId };

        } while (true);
    }

    // Confirms the parking lot location for |player|.
    confirmSelection(player) {
        const activeSelector = this.activeSelectors_.get(player);
        if (!activeSelector)
            throw new Error('The |player| is not currently selecting a parking lot.');

        activeSelector.cancel(ParkingLotCreator.REASON_CONFIRMED);
    }

    // Cancels the parking lot selector for |player|.
    cancelSelection(player) {
        const activeSelector = this.activeSelectors_.get(player);
        if (!activeSelector)
            throw new Error('The |player| is not currently selecting a parking lot.');

        activeSelector.cancel(ParkingLotCreator.REASON_CANCELED);
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

    // Displays the |message| (optionally with |args|) to the |player|. Returns whether the action
    // should be retried, as the player will be offered a choice in a dialog.
    async displayError(player, message, ...args) {
        return await Dialog.displayMessage(
            player, 'Unable to create the parking lot', Message.format(message, ...args),
            'Try again' /* leftButton */, 'Cancel' /* rightButton */);
    }

    // Called when |player| disconnects from the server. Cancels any active selectors.
    onPlayerDisconnect(player) {
        const activeSelector = this.activeSelectors_.get(player);
        if (!activeSelector)
            return;

        activeSelector.cancel(ParkingLotCreator.REASON_DISCONNECT);
    }

    dispose() {
        server.playerManager.removeObserver(this);
    }
}

// Reasons for which a parking lot selector can be canceled.
ParkingLotCreator.REASON_CANCELED = 0;
ParkingLotCreator.REASON_CONFIRMED = 1;
ParkingLotCreator.REASON_DISCONNECT = 2;

exports = ParkingLotCreator;
