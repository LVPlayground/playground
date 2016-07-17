// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const NavigationButton = require('components/text_draw/navigation_button.js');
const Rectangle = require('components/text_draw/rectangle.js');

// Background color of the user interface. Should be semi-transparent.
const BACKGROUND_COLOR = Color.fromRGBA(0, 0, 0, 100);

// Colours for the buttons, both in regular and hover state.
const BUTTON_REGULAR_COLOR = Color.RED;
const BUTTON_HOVER_COLOR = Color.YELLOW;

// Represents the user interface that will be shown to players as part of the Interior Selector.
// It allows them to see more information about it, including the price, and navigate back and forth
// depending on the other available interiors.
class InteriorSelectorUI {
    constructor(player, selector, interiorList) {
        this.player_ = player;
        this.selector_ = selector;
        this.interiorList_ = interiorList;

        this.background_ = new Rectangle(15, 400, 610, 40, BACKGROUND_COLOR);
        this.background_.displayForPlayer(player);

        // Create the navigational back-and-forward buttons for the player.
        this.previousButton_ = new NavigationButton(
            30, 409, NavigationButton.DIRECTION_LEFT, () => this.selector_.selectPrevious());

        this.nextButton_ = new NavigationButton(
            592, 409, NavigationButton.DIRECTION_RIGHT, () => this.selector_.selectNext());

        this.previousButton_.displayForPlayer(player);
        this.nextButton_.displayForPlayer(player);

        player.setSpectating(true);
        player.setSelectTextDraw(true, BUTTON_HOVER_COLOR);
    }

    // Displays the user interface specific to the interior at the given |index|.
    displayInterior(index) {
        const interior = this.interiorList_[index];

        // TODO: Update the title.
        // TODO: Update the property's price.
    }

    dispose() {
        this.player_.setSpectating(false);
        this.player_.setSelectTextDraw(false);

        this.previousButton_.hideForPlayer(this.player_);
        this.nextButton_.hideForPlayer(this.player_);
        this.background_.hideForPlayer(this.player_);

        this.previousButton_ = null;
        this.nextButton_ = null;
        this.background_ = null;
    }
}

exports = InteriorSelectorUI;
