// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ScopedCallbacks = require('base/scoped_callbacks.js');

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

        // Immediately show the color picker to the user.
        colorPicker.showPicker();

        return colorPicker.finished;
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

        this.callbacks_ = new ScopedCallbacks();
        this.callbacks_.addEventListener(
            'colorpickerresponse', ColorPicker.prototype.onColorPicked.bind(this));
    }

    // Returns the promise that is to be resolved or rejected when the color has been picked.
    get finished() { return this.finished_; }

    // Displays the color picker to the user. Sends a request to Pawn to display it immediately,
    // which will respond to JavaScript through an event that will be listened to.
    showPicker() {
        if (server.isTest()) {
            this.onColorPicked({ playerid: this.player_.id, color: Color.RED.toNumberRGB() });
            return;
        }

        pawnInvoke('OnColorPickerRequest', 'i', this.player_.id);
    }

    // Called when a color has been picked for a player. Will resolve the promise if that player
    // happens to be the one this instance exists for.
    onColorPicked(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player) {
            console.log('[ColorPicker] Received a `colorpicked` event for an invalid player: ' +
                         event.playerid);
            return;
        }

        this.callbacks_.dispose();
        this.resolve_(event.color != 0 ? Color.fromNumberRGBA(event.color)
                                       : null /* dismissed */);
    }
}

exports = ColorPicker;
