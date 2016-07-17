// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const InteriorSelectorUI = require('features/houses/utils/interior_selector_ui.js');

// Private symbol ensuring that the InteriorSelector constructor won't be used.
const PrivateSymbol = Symbol('Please use InteriorSelector.select() instead.');

// The interior selector offers a convenient way for players to select a location from one of the
// many interiors available in Grand Theft Auto: San Andreas. The selector can be started by
// calling the asynchronous "select" method, which returns a promise to be resolved when finished.
class InteriorSelector {
    static select(player, interiorList) {
        if (!Array.isArray(interiorList) || !interiorList.length)
            throw new Error('You must pass a list of interiors to the interior selector.');

        const selector = new InteriorSelector(PrivateSymbol, player, interiorList);
        selector.displayInterior(0 /* the first interior in the list */);

        return selector.finished;
    }

    // ---------------------------------------------------------------------------------------------

    constructor(privateSymbol, player, interiorList) {
        if (privateSymbol !== PrivateSymbol)
            throw new TypeError('Illegal constructor. Use InteriorSelector.select() instead.');

        this.player_ = player;
        this.interiorList_ = interiorList;
        this.interiorListIndex_ = 0;

        this.userInterface_ = new InteriorSelectorUI(player, this, interiorList);

        this.resolve_ = null;
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

    // Called when the "Purchase" button of the user interface has been clicked.
    selectPurchase() {
        this.resolve_(this.interiorList_[this.interiorListIndex_]);
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

        // TODO: Implement the actual animation for the current interior.

        this.userInterface_.displayInterior(index);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.userInterface_.dispose();
        this.userInterface_ = null;
    }
}

exports = InteriorSelector;
