// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Private symbol ensuring that the ModelSelector constructor won't be used.
const PrivateSymbol = Symbol('Please use ModelSelector.select() instead.');

// Weak map of currently in-progress selectors, keyed by a Player instance.
const activeSelectors = new WeakMap();

// There are tens of thousands of models in GTA: San Andreas, and it's impossible to remember the
// Model ID for each of them. The Model Selector provides a way out: given a list of IDs and
// optional labels and prices, it will present a nice user interface to the user.
class ModelSelector {
    // Creates the model selector for |player|, displaying the |models|. Each entry in |models| must
    // be an object having a {modelId, label, price}, the latter two of which are optional.
    static async select(player, title, models) {
        const instance = new ModelSelector(PrivateSymbol, player, title, models);
        activeSelectors.set(player, instance);

        const selectedModel = await instance.finished;
        activeSelectors.delete(player);

        return selectedModel;
    }

    // Returns the active selector for |player|, if any. Must only be used for testing.
    static getSelectorForPlayerForTests(player) {
        return activeSelectors.get(player);
    }

    // ---------------------------------------------------------------------------------------------

    constructor(privateSymbol, player, title, models) {
        if (privateSymbol !== PrivateSymbol)
            throw new TypeError('Illegal constructor. Use ModelSelector.select() instead.');

        this.player_ = player;
        this.title_ = title;
        this.models_ = models;

        this.finished_ = new Promise((resolve, reject) => {
            this.resolve_ = resolve;
            this.reject_ = reject;

        }).then(modelIndex => {
            if (typeof modelIndex === 'number')
                return this.models_[modelIndex];

            return null;
        });
    }

    // Gets the promise that is to be resolved once the player selected a model.
    get finished() { return this.finished_; }

    // ---------------------------------------------------------------------------------------------

    dispose() {}
}

exports = ModelSelector;
