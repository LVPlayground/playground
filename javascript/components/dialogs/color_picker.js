// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import ColorPickerManager from 'components/dialogs/color_picker_manager.js';

// Private symbol ensuring that the ColorPicker constructor won't be used.
const PrivateSymbol = Symbol('Please use the static methods.');

// Displays a color picker for a given player. The color picker functionality is implemented in
// Pawn and there is no huge value in moving it right now, so this is a mere shim to call through to
// that implementation and apply slightly different behaviour for tests.
class ColorPicker {
    // Shows a color picker to |player|. Returns a promise that will be resolved when they have
    // either selected a color, or dismissed the dialog.
    static show(player) {
        const colorPicker = new ColorPicker(PrivateSymbol, player);
        ColorPickerManager.register(player, colorPicker);

        return colorPicker.showPicker().then(color => {
            ColorPickerManager.unregister(player);
            return color;
        });
    }

    constructor(privateSymbol, player) {
        if (privateSymbol !== PrivateSymbol)
            throw new TypeError('Illegal constructor. Use the static methods instead.');

        this.player_ = player;

        this.resolve_ = null;
        this.finished_ = new Promise((resolve, reject) => {
            this.resolve_ = resolve;
        });
    }

    // Displays the color picker to the user. Sends a request to Pawn to display it immediately,
    // which will respond to JavaScript through an event that will be listened to.
    showPicker() {
        Promise.resolve().then(() => {
            if (server.isTest())
                this.didSelectColor(Color.RED);
            else
                pawnInvoke('OnColorPickerRequest', 'i', this.player_.id);
        });

        return this.finished_;
    }

    // Called when a color has been picked for a player. Will resolve the promise if that player
    // happens to be the one this instance exists for.
    didSelectColor(color) {
        this.resolve_(color);
    }
}

export default ColorPicker;
