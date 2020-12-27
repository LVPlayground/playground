// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { TextDraw } from 'entities/text_draw.js';

// Default display time for banners, specified in milliseconds.
export const kDefaultDisplayTimeMs = 3000;

// Implementation of the Banner component, a full-screen overlay to share something of disruptive
// importance with a player. Supports various configuration options in the static method.
export class Banner {
    static async displayForPlayer(player, { time = kDefaultDisplayTimeMs, title, message } = {}) {
        const elements = [
            createBackgroundElement(player),
            createTitleElement(player, title),
            createMessageElement(player, message),
        ];

        for (const element of elements)
            element.displayForPlayer(player);

        await wait(time);

        for (const element of elements)
            element.dispose();
    }
}

// Creates the text draw that'll be the background for the announcement. A model is used to be able
// to have a base that's wider on the right than it is on the left.
function createBackgroundElement(player) {
    return server.textDrawManager.createTextDraw({
        player,
        position: [ -17.666, 165.3 ],
        text: '_',

        backgroundColor: Color.fromRGBA(0, 0, 0, 0),
        color: Color.fromRGBA(0, 0, 0, 140),
        font: TextDraw.kFontModelPreview,
        outline: 0,
        proportional: false,
        shadow: 0,

        letterSize: [ 0, 0 ],
        textSize: [ 668, 86.3 ],

        previewModel: 19454,
        previewRotation: new Vector(0, 0, 70),
        previewScale: 0.375,
    });
}

// Creates the message that is to be displayed. Shouldn't be too long, but up to eight or nine words
// will be fine on any player's screen.
function createMessageElement(player, message) {
    return server.textDrawManager.createTextDraw({
        player,
        position: [ 320, 215 ],
        text: message,

        alignment: TextDraw.kAlignCenter,
        color: Color.fromRGBA(255, 220, 0, 240),
        outline: 0,
        proportional: true,
        shadow: 0,

        letterSize: [ 0.352331, 1.583407 ],
    });
}

// Creates the text draw that will display the headline of the announcement. Displayed in a big,
// chunky font, to give players an immediate overview of what's changed.
function createTitleElement(player, title) {
    return server.textDrawManager.createTextDraw({
        player,
        position: [ 320, 190 ],
        text: title,

        alignment: TextDraw.kAlignCenter,
        color: Color.fromRGBA(255, 255, 255, 240),
        font: TextDraw.kFontPricedown,
        outline: 0,
        proportional: true,
        shadow: 0,

        letterSize: [ 0.66, 2.1435 ],
    });
}
