// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Dialog from 'components/dialogs/dialog.js';
import InteriorSelectorUI from 'features/houses/utils/interior_selector_ui.js';

// Number of milliseconds to wait before animating the camera within a house scene.
const HOUSE_SCENE_PRELOAD_MS = 1000;

// Private symbol ensuring that the InteriorSelector constructor won't be used.
const PrivateSymbol = Symbol('Please use InteriorSelector.select() instead.');

// The interior selector offers a convenient way for players to select a location from one of the
// many interiors available in Grand Theft Auto: San Andreas. The selector can be started by
// calling the asynchronous "select" method, which returns a promise to be resolved when finished.
class InteriorSelector {
    static select(player, availableMoney, interiorList) {
        if (!Array.isArray(interiorList) || !interiorList.length)
            throw new Error('You must pass a list of interiors to the interior selector.');

        if (server.isTest())
            return Promise.resolve({ id: 0, price: 50000 });

        const selector = new InteriorSelector(PrivateSymbol, player, availableMoney, interiorList);
        selector.displayInterior(0 /* the first interior in the list */);

        return selector.finished;
    }

    // ---------------------------------------------------------------------------------------------

    constructor(privateSymbol, player, availableMoney, interiorList) {
        if (privateSymbol !== PrivateSymbol)
            throw new TypeError('Illegal constructor. Use InteriorSelector.select() instead.');

        this.player_ = player;
        this.player_.serializeState(true /* restoreOnSpawn */);

        this.availableMoney_ = availableMoney;
        this.interiorList_ = interiorList;
        this.interiorListIndex_ = 0;

        this.userInterface_ = new InteriorSelectorUI(player, availableMoney, this, interiorList);

        this.resolve_ = null;
        this.done_ = false;

        this.finished_ = new Promise(resolve => {
            this.resolve_ = resolve;

        }).then(selection => {
            this.dispose();  // self-dispose the selector

            return selection;
        });
    }

    // Gets the finished promise, which will resolve when an interior has been selected.
    get finished() { return this.finished_; }

    // ---------------------------------------------------------------------------------------------

    // Called when the "Previous" button of the user interface has been clicked.
    selectPrevious() {
        let previousIndex = this.interiorListIndex_ - 1;

        if (previousIndex < 0)
            previousIndex = this.interiorList_.length - 1;

        this.displayInterior(previousIndex);
    }

    // Called when the "Purchase" button of the user interface has been clicked. Verify that the
    // player isn't trying to purchase a property they don't have sufficient money available for.
    selectPurchase() {
        const interior = this.interiorList_[this.interiorListIndex_];
        if (interior.price > this.availableMoney_) {
            Dialog.displayMessage(this.player_, 'Unable to purchase this house',
                                  Message.HOUSE_PURCHASE_TOO_EXPENSIVE, 'Close' /* leftButton */,
                                  '' /* rightButton */);
            return;
        }

        this.resolve_(interior);
    }

    // Called when the "Cancel" button of the user interface has been clicked.
    selectCancel() {
        this.resolve_(null);
    }

    // Called when the "Next" button of the user interface has been clicked.
    selectNext() {
        let nextIndex = this.interiorListIndex_ + 1;
        if (nextIndex >= this.interiorList_.length)
            nextIndex = 0;

        this.displayInterior(nextIndex);
    }

    // ---------------------------------------------------------------------------------------------

    // Displays the interior at |index| of the stored interior list.
    displayInterior(index) {
        this.interiorListIndex_ = index;

        const interior = this.interiorList_[index];
        const interiorPreview = interior.preview;

        // Make sure that the player is in the correct interior to view this interior, and in their
        // own virtual world so that they're not bothered by others.
        this.player_.interior = interior.interior;
        this.player_.virtualWorld = VirtualWorld.forPlayer(this.player_);

        // Force-update the streamer for this player to make sure custom houses are visible.
        this.player_.updateStreamer(
            new Vector(...interiorPreview.position[0]), VirtualWorld.forPlayer(this.player_),
            interior.interior, 0 /* STREAMER_TYPE_OBJECT */);

        // Set the player's camera to the initial frame of the interior's preview.
        this.player_.setCamera(new Vector(...interiorPreview.position[0]),
                               new Vector(...interiorPreview.target[0]));

        // Wait for some time in order to give the scene a chance to load for this player.
        wait(HOUSE_SCENE_PRELOAD_MS).then(() => {
            if (this.interiorListIndex_ !== index)
                return;  // the player has navigated away from this scene

            if (this.done_)
                return;  // the player has closed the interior selector

            // Interpolate the player's camera to a different position to add interactivity.
            this.player_.interpolateCamera(
                new Vector(...interiorPreview.position[0]),  // positionFrom
                new Vector(...interiorPreview.position[1]),  // positionTo
                new Vector(...interiorPreview.target[0]),  // targetFrom
                new Vector(...interiorPreview.target[1]),  // targetTo
                interiorPreview.duration);
        });

        this.userInterface_.displayInterior(index);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.userInterface_.dispose();
        this.userInterface_ = null;

        this.done_ = true;
    }
}

export default InteriorSelector;
