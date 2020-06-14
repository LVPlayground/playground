// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import NavigationButton from 'components/text_draw/navigation_button.js';
import Rectangle from 'components/text_draw/rectangle.js';
import TextDraw from 'components/text_draw/text_draw.js';

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

        // Create the navigational acknowledge and cancel buttons for the player.
        this.acceptButton_ = new NavigationButton(
            532, 409, NavigationButton.ACTION_OK, () => this.selector_.selectPurchase());
        this.cancelButton_ = new NavigationButton(
            562, 409, NavigationButton.ACTION_CANCEL, () => this.selector_.selectCancel());

        this.previousButton_.displayForPlayer(player);
        this.nextButton_.displayForPlayer(player);

        this.acceptButton_.displayForPlayer(player);
        this.cancelButton_.displayForPlayer(player);

        this.active_ = true;
        this.ensureSelecting();

        player.setSpectating(true);

        Promise.resolve().then(() => pawnInvoke('OnToggleStatisticsDisplay', 'ii', player.id, 0));
    }

    // Makes sure that the player continues to have a cursor available to them for the duration of
    // the interior selector. This method spins until the player leaves the selector or disconnects.
    async ensureSelecting() {
        while (this.active_) {
            if (!this.player_.isConnected())
                return;

            pawnInvoke('SelectTextDraw', 'ii', this.player_.id, BUTTON_HOVER_COLOR.toNumberRGBA());
            await wait(1000);
        }
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

        const vipSuffix = interior.vip ? ' ~y~]]'
                                       : '';

        this.title_.updateTextForPlayer(this.player_, interior.name + vipSuffix);
        this.updatePriceDisplay(interior.price);
    }

    dispose() {
        this.active_ = false;

        Promise.resolve().then(() => {
            pawnInvoke('CancelSelectTextDraw', 'i', this.player_.id);
            pawnInvoke('OnToggleStatisticsDisplay', 'ii', this.player_.id, 1);
        });

        this.player_.setSpectating(false);

        this.acceptButton_.hideForPlayer(this.player_);
        this.cancelButton_.hideForPlayer(this.player_);
        this.previousButton_.hideForPlayer(this.player_);
        this.nextButton_.hideForPlayer(this.player_);
        this.title_.hideForPlayer(this.player_);
        this.background_.hideForPlayer(this.player_);

        if (this.price_)
            this.price_.hideForPlayer(this.player_);

        this.acceptButton_ = null;
        this.cancelButton_ = null;
        this.previousButton_ = null;
        this.nextButton_ = null;
        this.title_ = null;
        this.price_ = null;
        this.background_ = null;
    }
}

export default InteriorSelectorUI;
