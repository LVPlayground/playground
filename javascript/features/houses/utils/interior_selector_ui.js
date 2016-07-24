// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const NavigationButton = require('components/text_draw/navigation_button.js');
const Rectangle = require('components/text_draw/rectangle.js');
const TextDraw = require('components/text_draw/text_draw.js');

// Background color of the user interface. Should be semi-transparent.
const BACKGROUND_COLOR = Color.fromRGBA(0, 0, 0, 100);

// Colours for the buttons, both in regular and hover state.
const BUTTON_REGULAR_COLOR = Color.RED;
const BUTTON_HOVER_COLOR = Color.YELLOW;

// Represents the user interface that will be shown to players as part of the Interior Selector.
// It allows them to see more information about it, including the price, and navigate back and forth
// depending on the other available interiors.
class InteriorSelectorUI {
    constructor(player, availableMoney, selector, interiorList) {
        this.player_ = player;
        this.availableMoney_ = availableMoney;
        this.selector_ = selector;
        this.interiorList_ = interiorList;

        this.background_ = new Rectangle(15, 400, 610, 40, BACKGROUND_COLOR);
        this.background_.displayForPlayer(player);

        // Create the title that describes the name of this property. The price will be created on-
        // demand because varying colours are used to indicate availability.
        this.title_ = new TextDraw({
            position: [ 320, 400 ],
            letterSize: [ 0.573395, 1.836444 ],
            color: Color.WHITE,
            text: '_',

            font: TextDraw.FONT_CLASSIC,
            alignment: TextDraw.ALIGN_CENTER
        });

        this.title_.displayForPlayer(player);

        // Create the navigational back-and-forward buttons for the player.
        this.previousButton_ = new NavigationButton(
            30, 409, NavigationButton.DIRECTION_LEFT, () => this.selector_.selectPrevious());

        this.nextButton_ = new NavigationButton(
            592, 409, NavigationButton.DIRECTION_RIGHT, () => this.selector_.selectNext());

        this.previousButton_.displayForPlayer(player);
        this.nextButton_.displayForPlayer(player);

        player.setSpectating(true);
        player.setSelectTextDraw(true, BUTTON_HOVER_COLOR);
        player.toggleStatisticsDisplay(false);
    }

    // Formats the price as a string using underscores as the thousand separator.
    formatPrice(price) {
        return '$' + price.toFixed(0).replace(/(\d)(?=(\d{3})+$)/g, '$1_');
    }

    // Creates or updates the text draw display for the price of the house. Different colours will
    // be used to indicate whether the player can purchase the property or not.
    updatePriceDisplay(price) {
        const canPurchase = price <= this.availableMoney_;
        const color = canPurchase ? Color.GREEN
                                  : Color.RED;

        // Update the text if it already exists and has the same color.
        if (this.price_ && this.price_.color === color) {
            this.price_.updateTextForPlayer(this.player_, this.formatPrice(price));
            return;
        }

        if (this.price_)
            this.price_.hideForPlayer(this.player_);

        this.price_ = new TextDraw({
            position: [ 320, 420 ],
            letterSize: [ 0.260464, 1.064890 ],
            color: color,
            proportional: true,
            text: this.formatPrice(price),

            font: TextDraw.FONT_MONOSPACE,
            alignment: TextDraw.ALIGN_CENTER
        });

        this.price_.displayForPlayer(this.player_);
    }

    // Displays the user interface specific to the interior at the given |index|.
    displayInterior(index) {
        const interior = this.interiorList_[index];

        this.title_.updateTextForPlayer(this.player_, interior.name);
        this.updatePriceDisplay(interior.price);
    }

    dispose() {
        this.player_.setSpectating(false);
        this.player_.setSelectTextDraw(false);
        this.player_.toggleStatisticsDisplay(true);

        this.previousButton_.hideForPlayer(this.player_);
        this.nextButton_.hideForPlayer(this.player_);
        this.title_.hideForPlayer(this.player_);
        this.background_.hideForPlayer(this.player_);

        if (this.price_)
            this.price_.hideForPlayer(this.player_);

        this.previousButton_ = null;
        this.nextButton_ = null;
        this.title_ = null;
        this.background_ = null;
    }
}

exports = InteriorSelectorUI;
