// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Represents the dialog backing the model selector, rendering the user interface containing the
// title, and, when there are multiple pages, page indicator and navigation buttons.
class ModelSelectorDialog {
    constructor(delegate, player, title, models, currentPage, pages) {
        this.delegate_ = delegate;

        this.player_ = player;
        this.title_ = title;

        this.models_ = models;

        this.currentPage_ = currentPage;
        this.pages_ = pages;
    }

    // Displays the dialog, as well as the individual tiles for the models, to the |this.player_|.
    display() {
        // TODO: Implement this.
    }

    dispose() {
        // TODO: Implement this.
    }
}

// Number of models to display on a single row in the model selector.
ModelSelectorDialog.COLUMN_COUNT = 6;

// Number of rows of models to display per page of the model selector.
ModelSelectorDialog.ROW_COUNT = 3;

exports = ModelSelectorDialog;
