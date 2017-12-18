// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import ModelSelectorDialog from 'features/houses/utils/model_selector_dialog.js';

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

        instance.displayPage(1);

        const selectedModel = await instance.finished;
        activeSelectors.delete(player);

        instance.dispose();

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

        this.currentPage_ = null;

        this.dialog_ = null;

        this.resolve_ = null;
        this.reject_ = null;  // TODO: Do we need rejection for anything? Disconnect?

        this.finished_ = new Promise((resolve, reject) => {
            this.resolve_ = resolve;
            this.reject_ = reject;
        });
    }

    // Gets the active dialog for the player.
    get dialog() { return this.dialog_; }

    // Gets the promise that is to be resolved once the player selected a model.
    get finished() { return this.finished_; }

    // ---------------------------------------------------------------------------------------------

    // Displays the page having |number|, which is a one-based index, to the player.
    displayPage(number) {
        this.currentPage_ = number;

        if (this.dialog_)
            this.dialog_.dispose();

        const modelsPerPage = ModelSelectorDialog.COLUMN_COUNT * ModelSelectorDialog.ROW_COUNT;
        const modelsOffset = (number - 1) * modelsPerPage;

        const models = this.models_.slice(modelsOffset, modelsOffset + modelsPerPage);

        this.dialog_ =
            new ModelSelectorDialog(this, this.player_, this.title_, models, number, this.pageCount);

        // Immediately display the created dialog to the player.
        this.dialog_.display();
    }

    // ---------------------------------------------------------------------------------------------
    // Delegate methods
    // ---------------------------------------------------------------------------------------------

    // To be called when the given |model| has been selected.
    didSelectModel(model) {
        this.resolve_(model);
    }

    // To be called when the player has requested the next page to be displayed.
    didRequestNextPage() {
        const modelsPerPage = ModelSelectorDialog.COLUMN_COUNT * ModelSelectorDialog.ROW_COUNT;
        const pageCount = Math.ceil(this.models_.length / modelsPerPage);

        if (this.currentPage_ < pageCount)
            this.displayPage(this.currentPage_ + 1);
        else
            this.displayPage(1 /* cycle back to the first page */);
    }

    // To be called when the player has requested the previous page to be displayed.
    didRequestPreviousPage() {
        const modelsPerPage = ModelSelectorDialog.COLUMN_COUNT * ModelSelectorDialog.ROW_COUNT;
        const pageCount = Math.ceil(this.models_.length / modelsPerPage);

        if (this.currentPage_ > 1)
            this.displayPage(this.currentPage_ - 1);
        else
            this.displayPage(pageCount /* cycle back to the last page */);
    }

    // To be called when the player has canceled selecing a model through the user interface.
    didCancel() {
        this.resolve_(null);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.dialog_.dispose();
        this.dialog_ = null;
    }
}

export default ModelSelector;
