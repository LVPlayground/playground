// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Class that provides the user interface required for *removing* a previously created parking lot.
// It will highlight the existing parking lots and verify input of the `/house remove` command.
class ParkingLotRemover {
    constructor() {
        this.activeSelectors_ = new WeakMap();

        // Observe disconnecting players so that we can cancel their creator.
        server.playerManager.addObserver(this);
    }

    // Returns whether |player| is currently selecting a parking lot.
    isSelecting(player) {
        return this.activeSelectors_.has(player);
    }

    // Creates a parking lot selector for |player| for |location| that enables them to remove the
    // highlighted parking lot locations.
    async select(player, location) {
        // TODO: Display identity beams w/ labels for all parking lot locations.

        let result = null;
        do {
            const finishedPromise = new Promise(resolve =>
                this.activeSelectors_.set(player, { cancel: resolve }));

            const [ finishedReason, finishedResult ] = await finishedPromise;

            this.activeSelectors_.delete(player);

            // Bail out if the location wasn't confirmed by the player.
            if (finishedReason != ParkingLotRemover.REASON_CONFIRMED)
                break;

            // TODO: Actually do something sensible here.

            break;

        } while (true);

        // TODO: Destroy the identify beams and labels for all the locations.

        return result;
    }

    // Confirms the parking lot to remove for |player|.
    confirmSelection(player, id) {
        const activeSelector = this.activeSelectors_.get(player);
        if (!activeSelector)
            throw new Error('The |player| is not currently removing a parking lot.');

        activeSelector.cancel([ ParkingLotRemover.REASON_CONFIRMED, id ]);
    }

    // Cancels the parking lot removal as initiated by |player|.
    cancelSelection(player) {
        const activeSelector = this.activeSelectors_.get(player);
        if (!activeSelector)
            throw new Error('The |player| is not currently removing a parking lot.');

        activeSelector.cancel([ ParkingLotRemover.REASON_CANCELED, null ]);
    }

    // ---------------------------------------------------------------------------------------------
    // Private functions

    // Called when |player| disconnects from the server. Cancels any active selectors.
    onPlayerDisconnect(player) {
        const activeSelector = this.activeSelectors_.get(player);
        if (!activeSelector)
            return;

        activeSelector.cancel([ ParkingLotRemover.REASON_DISCONNECT, null ]);
    }

    dispose() {
        server.playerManager.removeObserver(this);
    }
}

// Reasons for which a parking lot selector can be canceled.
ParkingLotRemover.REASON_CANCELED = 0;
ParkingLotRemover.REASON_CONFIRMED = 1;
ParkingLotRemover.REASON_DISCONNECT = 2;

exports = ParkingLotRemover;
