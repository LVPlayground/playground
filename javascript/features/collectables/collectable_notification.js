// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import TextDraw from 'components/text_draw/text_draw.js';

// Implements an on-screen notification used to inform users that they've collected a collectable
// of a particular type. Each type of collectable has their own, slightly different style, while
// the general implementation and behaviour is uniform.
export class CollectableNotification {
    static async showForPlayer(player, displayTime, titleText, messageText) {
        const background = createBackground();
        const headline = createHeadline(titleText);
        const message = createMessage(messageText);

        const composition = [ background, headline, message ];

        for (const element of composition)
            element.displayForPlayer(player);

        await wait(displayTime * 1000);
        if (!player.isConnected())
            return;

        for (const element of composition)
            element.hideForPlayer(player);
    }
}

// Creates the text draw that'll be the background for the announcement. A model is used to be able
// to have a base that's wider on the right than it is on the left.
function createBackground() {
    return new TextDraw({
        position: [ -17.666, 165.3 ],
        previewModel: 19454,
        previewRotation: new Vector(0, 0, 70),
        previewZoom: 0.375,
        text: '_',

        shadowColor: Color.fromRGBA(0, 0, 0, 0),
        color: Color.fromRGBA(0, 0, 0, 140),
        outlineSize: 0,
        proportional: false,
        shadowSize: 0,

        letterSize: [ 0, 0 ],
        textSize: [ 668, 86.3 ],
    });
}

// Creates the text draw that will display the headline of the announcement. Displayed in a big,
// chunky font, to give players an immediate overview of what's changed.
function createHeadline(text) {
    return new TextDraw({
        font: TextDraw.FONT_PRICEDOWN,
        position: [ 320, 190 ],
        text,

        alignment: TextDraw.ALIGN_CENTER,
        color: Color.fromRGBA(255, 255, 255, 240),
        outlineSize: 0,
        shadowSize: 0,

        letterSize: [ 0.66, 2.1435 ],
        proportional: true,
    });
}

// Creates the message that is to be displayed. Shouldn't be too long, but up to eight or nine words
// will be fine on any player's screen.
function createMessage(text) {
    return new TextDraw({
        font: TextDraw.FONT_SANS_SERIF,
        position: [ 320, 215 ],
        text,

        alignment: TextDraw.ALIGN_CENTER,
        color: Color.fromRGBA(255, 220, 0, 240),
        outlineSize: 0,
        shadowSize: 0,

        letterSize: [ 0.352331, 1.583407 ],
        proportional: true,
    });
}
