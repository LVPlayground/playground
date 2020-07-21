// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Color } from 'base/color.js';
import { Rectangle } from 'components/text_draw/rectangle.js';
import { TextDraw } from 'components/text_draw/text_draw.js';

// Highlight colour to display on the cancel button when hovering over it.
const kCancelButtonHighlightColor = Color.fromRGBA(0xB0, 0xBE, 0xC5, 0xFF);

// Height and width of the individual color rectangles.
const kColorRectangleMarginX = 9;
const kColorRectangleMarginY = 0.5;

const kColorRectangleHeight = 20.0;
const kColorRectangleWidth = 16.0;

// Height to reserve for the picker's header, indicating the phase of selection.
const kHeaderHeight = 13.0;

// The background color for the color picker, a dark, slightly transparent black.
const kPickerBackgroundColor = Color.fromRGBA(0, 0, 0, 0x85);

// Offset of the picker itself on the player screens. Based on GTA's canonical screen resolution.
const kPickerOffsetX = 32.0;
const kPickerOffsetY = 154.0;

// Compound values of the above definitions, to avoid having complicated calculations inline.
const kPickerWidth = 7 * kColorRectangleMarginX + 6 * kColorRectangleWidth;
const kPickerHeight = 7 * kColorRectangleMarginY + 6 * kColorRectangleHeight + kHeaderHeight + 15;

// After how many seconds do we automatically time out the colour picker?
const kPickerTimeoutMs = 5 * 1000;

// Displays a color picker for the |player| with the given |colors|, which must be an array with 36
// instances of the Color object. Will return a Color instance when selected, or NULL when aborted.
export async function displayColorPicker(player, title, colors) {
    let resolver = null;

    const promise = new Promise(resolve => resolver = resolve);
    const elements = [
        createBackgroundElement(),
        createTitleElement(title),
        createCancelButton(),
        createCancelButtonLabel(resolver.bind(/* thisArg= */ null, /* color= */ null)),
    ];

    // Create elements for all the |colors| that can be selected by the player.
    for (const color of colors) {
        elements.push(createColorElement({
            index: elements.length - 4,
            color: color,

            // Invoke the |resolver| with the given |color| when clicked on by the |player|.
            listener: resolver.bind(/* thisArg= */ null, color),
        }));
    }

    // (1) Display the color picker to the |player|.
    for (const element of elements)
        element.displayForPlayer(player);

    // (2) Schedule a timer for |kPickerTimeoutMs| to automatically time out the picker, if needed.
    wait(kPickerTimeoutMs).then(() => {
        if (resolver)
            resolver(/* color= */ null);
    });

    // (3) Start selecting for the |player| and wait for the picker to complete, either by timeout,
    // cancellation or selection. We clean up our state immediately after.
    pawnInvoke('SelectTextDraw', 'ii', player.id, kCancelButtonHighlightColor.toNumberRGBA());

    const color = await promise;

    pawnInvoke('CancelSelectTextDraw', 'i', player.id);

    resolver = null;  // avoid double-resolving

    // (4) Remove all the |elements| for the player, as the folow has completed
    for (const element of elements)
        element.hideForPlayer(player);

    // (5) And return the selected |color| (which may be NULL) to the caller.
    return color;
}

// Creates an element for the picker's background for the |player|. An adjustment will be applied in
// the element's height as something's wrong with the Rectangle calculation.
function createBackgroundElement() {
    return new Rectangle(
        /* x= */ kPickerOffsetX,
        /* y= */ kPickerOffsetY,
        /* width= */ kPickerWidth,
        /* height= */ kPickerHeight,
        /* color= */ kPickerBackgroundColor);
}

// Creates an element to represent the picker's title, which helps the player understand where in
// the color selection flow they are. Real complicated with two steps.
function createTitleElement(title) {
    return new TextDraw({
        text: title,
        position: [
            kPickerOffsetX + 0.666 * kColorRectangleMarginX,
            kPickerOffsetY + 1,
        ],

        font: TextDraw.FONT_SANS_SERIF,
        letterSize: [ 0.27, 0.90 ],
        shadowSize: 0,
    });
}

// Creates a cancel button that will invoke the |listener| once clicked upon. This helps players
// when they change their minds, and actually don't want to change colors at all.
function createCancelButton() {
    return new Rectangle(
        /* x= */ kPickerOffsetX,
        /* y= */ kPickerOffsetY + kPickerHeight - /* arbitrary? */ 9.0,
        /* width= */ kPickerWidth,
        /* height= */ kColorRectangleHeight,
        /* color= */ kPickerBackgroundColor);
}

// Creates the text label to draw on the cancel button.
function createCancelButtonLabel(listener) {
    return new ClickableTextDraw(listener, {
        text: 'CANCEL',
        position: [
            kPickerOffsetX + kPickerWidth / 2,
            kPickerOffsetY + kPickerHeight - /* arbitrary? */ 5.5,
        ],

        alignment: TextDraw.ALIGN_CENTER,
        font: TextDraw.FONT_SANS_SERIF,
        letterSize: [ 0.39, 0.90 ],
        shadowSize: 0,
        selectable: true,
    });
}

// Creates an element to represent the given |color|, at the given |index| on the 6x6 grid. The
// |listener| will be called when the color has been selected.
function createColorElement({ index, color, listener } = {}) {
    const elementRow = Math.floor(index / 6);
    const elementColumn = index % 6;

    const elementOffsetX =
        kPickerOffsetX + kColorRectangleMarginX +
            elementColumn * (kColorRectangleMarginX + kColorRectangleWidth);

    const elementOffsetY =
        kPickerOffsetY + kColorRectangleMarginY + kHeaderHeight +
            elementRow * (kColorRectangleMarginY + kColorRectangleHeight);

    return new ClickableTextDraw(listener, {
        position: [ elementOffsetX + kColorRectangleWidth / 2, elementOffsetY ],
        text: '_',

        alignment: TextDraw.ALIGN_CENTER,
        letterSize: [ 0.0, 1.775 ],
        textSize: [ kColorRectangleWidth, kColorRectangleHeight ],
        selectable: true,

        boxColor: color,
        useBox: true,
    });
}

// Implementation of the TextDraw class that listens to click events from the player.
class ClickableTextDraw extends TextDraw {
    #listener_ = null;

    constructor(listener, ...params) {
        super(...params);

        this.#listener_ = listener;
    }

    // Called when the |player| has clicked on this text draw. Invokes the listener.
    onClick(player) { this.#listener_.call(null); }
}
