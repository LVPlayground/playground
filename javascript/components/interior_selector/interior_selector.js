// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const DefaultInteriorList = require('components/interior_selector/default_interior_list.js');

// Private symbol ensuring that the InteriorSelector constructor won't be used.
const PrivateSymbol = Symbol('Please use the static methods.');

// The interior selector offers a convenient way for players to select a location from one of the
// many interiors available in Grand Theft Auto: San Andreas.
class InteriorSelector {
    // Allows |player| to select an interior. Will return a promise that will be resolved with the
    // interior when one has been selected, or with NULL when selection has been canceled.
    static select(player, list = DefaultInteriorList) {
        const selector = new InteriorSelector(PrivateSymbol, player);
        selector.select(list);

        return selector.finished;
    }

    constructor(privateSymbol, player) {
        if (privateSymbol !== PrivateSymbol)
            throw new TypeError('Illegal constructor. Use the static methods instead.');

        this.player_ = player;

        this.resolve_ = null;
        this.reject_ = null;

        this.finished_ = new Promise((resolve, reject) => {
            this.resolve_ = resolve;
            this.reject_ = reject;
        });
    }

    // Returns the promise that is to be resolved or rejected when the question has completed.
    get finished() { return this.finished_; }

    // Selects an interior from |list|.
    select(list) {
        this.resolve_(null);
    }
}

exports = InteriorSelector;
