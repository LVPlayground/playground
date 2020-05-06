// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Color from 'base/color.js';
import TextDraw from 'components/text_draw/text_draw.js';

// After how many milliseconds should the money indicator be removed again?
const kMoneyIndicatorDisplayTimeMs = 2500;

// Colour to display the message in when a player's wealth has decreased.
const kWealthDecreasedColor = Color.fromRGBA(255, 0, 0, 153);

// Symbol to force developers to use the MoneyIndicator.showForPlayer() static.
const PrivateSymbol = Symbol('MoneyIndicatorConstructor');

// Map containing the active indicator instance for a given player.
const indicatorForPlayerMap = new WeakMap();

// Current display token. Will be infinitely increased. Until MAX_SAFE_INTEGER at least.
let currentDisplayToken = 0;

// When a player receives money or actually spends money, we show the amount in either green (for
// increases) or red (for decreases) text under their HUD in the top-right of the window.
export class MoneyIndicator {
    // Will show the money indicator for the given |player|, indicating a change of |amount|.
    static showForPlayer(player, amount) {
        if (amount >= 0)
            return;  // TODO: do we want to show increases?

        const activeIndicator = indicatorForPlayerMap.get(player);
        if (activeIndicator) {
            activeIndicator.show(amount);
        } else {
            const playerIndicator = new MoneyIndicator(PrivateSymbol, player);
            playerIndicator.show(amount);

            indicatorForPlayerMap.set(player, playerIndicator);
        }
    }

    player_ = null;
    textDraw_ = null;
    token_ = null;

    constructor(privateSymbol, player) {
        if (privateSymbol !== PrivateSymbol)
            throw new Error('Please use MoneyIndicator::showForPlayer() instead.');
        
        this.player_ = player;
        this.textDraw_ = new TextDraw({
            position: [502, 96],
            text: '-00000000',

            font: TextDraw.FONT_PRICEDOWN,
            color: kWealthDecreasedColor,
            letterSize: [ 0.5799, 2.2000 ],
            outlineSize: 1,
            proportional: true,
            shadowSize: 1,
        });
    }

    // Shows the indicator to the current player for the given |amount|. Will update the existing
    // text draw if it's already being shown.
    show(amount) {
        const textualAmount = '-' + ('0000000' + Math.floor(Math.abs(amount))).substr(-8);
        const token = currentDisplayToken++;

        this.textDraw_.updateTextForPlayer(this.player_, textualAmount);
        this.token_ = token;

        wait(kMoneyIndicatorDisplayTimeMs).then(() => {
            if (this.token_ !== token)
                return;  // the text has been updated since
            
            this.textDraw_.hideForPlayer(this.player_);
            this.textDraw_ = null;

            indicatorForPlayerMap.delete(this.player_);
        });
    }
}
