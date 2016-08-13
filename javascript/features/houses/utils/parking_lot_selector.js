// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Dialog = require('components/dialogs/dialog.js');

// Utility function allowing administrators to select a location at which a parking lot should be
// created for a given location. There is a maximum distance at which they can be created.
class ParkingLotSelector {
    constructor() {
        this.activeSelectors_ = new WeakMap();

        // Observe disconnecting players so that we can cancel their selector.
        server.playerManager.addObserver(this);
    }

    // Returns whether |player| is currently selecting a parking lot.
    isSelecting(player) {
        return this.activeSelectors_.has(player);
    }

    // Creates a parking lot selector for |player| for |location|. The player should have been
    // displayed usage instructions for the selector.
    async select(player, location) {
        do {
            const finishedReason = await new Promise(resolve =>
                this.activeSelectors_.set(player, { cancel: resolve }));

            this.activeSelectors_.delete(player);

            // Bail out if the location wasn't confirmed by the player.
            if (finishedReason != ParkingLotSelector.REASON_CONFIRMED)
                return null;

            const [ action, result ] = await this.doSelection(player, location);
            switch (action) {
                case ParkingLotSelector.ACTION_ABORT:
                  return null;
                case ParkingLotSelector.ACTION_RETRY:
                  break;
                case ParkingLotSelector.ACTION_SUCCESS:
                  return result;
            }
        } while (true);
    }

    // Virtual function that does the actual selection for this selector.
    async doSelection(player, location) {
        throw new Error('Unable to do the selection: method must be overridden.');
    }

    // Confirms the parking lot location for |player|.
    confirmSelection(player) {
        const activeSelector = this.activeSelectors_.get(player);
        if (!activeSelector)
            throw new Error('The |player| is not currently selecting a parking lot.');

        activeSelector.cancel(ParkingLotSelector.REASON_CONFIRMED);
    }

    // Cancels the parking lot selector for |player|.
    cancelSelection(player) {
        const activeSelector = this.activeSelectors_.get(player);
        if (!activeSelector)
            throw new Error('The |player| is not currently selecting a parking lot.');

        activeSelector.cancel(ParkingLotSelector.REASON_CANCELED);
    }

    // ---------------------------------------------------------------------------------------------
    // Private functions

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

        activeSelector.cancel(ParkingLotSelector.REASON_DISCONNECT);
    }

    dispose() {
        server.playerManager.removeObserver(this);
    }
}

// Actions that can be triggered by the doSelection() method.
ParkingLotSelector.ACTION_ABORT = 0;
ParkingLotSelector.ACTION_RETRY = 1;
ParkingLotSelector.ACTION_SUCCESS = 2;

// Reasons for which a parking lot selector can be canceled.
ParkingLotSelector.REASON_CANCELED = 0;
ParkingLotSelector.REASON_CONFIRMED = 1;
ParkingLotSelector.REASON_DISCONNECT = 2;

exports = ParkingLotSelector;
