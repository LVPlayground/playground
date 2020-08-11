// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { PlayerTextDrawNatives, TextDrawNatives } from 'entities/text_draw_natives.js';
import { TextDraw } from 'entities/text_draw.js';

import { MockTextDrawNatives } from 'entities/text_draw_natives.js';

// Manages the text draws that have been created on the server, both per-player text draws and ones
// that are global to all players. Text Draws can be created by the ScopedEntities class too.
export class TextDrawManager {
    #globalTextDraws_ = null;
    #playerTextDraws_ = null;

    constructor() {
        this.#globalTextDraws_ = new Set();
        this.#playerTextDraws_ = new Set();
    }

    // Gets the total number of text draws that has been created on the server.
    get count() { return this.#globalTextDraws_.size + this.#playerTextDraws_.size; }
    get size() { return this.count; }

    // Provides the ability to iterate over all created text draws on the server.
    *[Symbol.iterator]() {
        yield* this.#globalTextDraws_.values();
        yield* this.#playerTextDraws_.values();
    }

    // Creates a text draw on the server. The position and text are required, all other values are
    // optional. When a |player| is given, a per-player text draw will be created, otherwise a
    // global text draw will be preferred instead.
    createTextDraw({ position, text, player = null, alignment = null, backgroundColor = null,
                     box = null, boxColor = null, color = null, font = null, letterSize = null,
                     outline = null, previewModel = null, previewRotation = null,
                     previewScale = null, previewVehicleColor = null, proportional = null,
                     selectable = null, shadow = null, textSize = null } = {}) {
        let natives = null;

        // Determine on the scope of the text draw, which defines how we'll create it and interact
        // with it. Mocked natives will always be used when running tests.
        if (server.isTest())
            natives = new MockTextDrawNatives();
        else if (player !== null)
            natives = new PlayerTextDrawNatives(player);
        else
            natives = new TextDrawNatives();

        const textDraw = new TextDraw(this, natives);

        // Initialize the text draw, with all available settings. This will create it on the server.
        textDraw.initialize(position, text, {
            alignment, backgroundColor, box, boxColor, color, font, letterSize, outline,
            previewModel, previewRotation, previewScale, previewVehicleColor, proportional,
            selectable, shadow, textSize
        });

        // Depending on whether a |player| was given, store it in the global or in the player bucket
        // in our internal storage. This might make mapping easier when necessary.
        if (player !== null)
            this.#playerTextDraws_.add(textDraw);
        else
            this.#globalTextDraws_.add(textDraw);

        // Return the text draw so that the caller can do whatever they want with it.
        return textDraw;
    }

    // Removes the |textDraw| from the maintained set of text draws. Should only be used by the
    // TextDraw implementation to inform the manager about their disposal.
    didDisposeTextDraw(textDraw) {
        this.#globalTextDraws_.delete(textDraw);
        this.#playerTextDraws_.delete(textDraw);
    }

    // Removes all existing text draws from the server.
    dispose() {
        this.#globalTextDraws_.forEach(textDraw => textDraw.dispose());
        this.#playerTextDraws_.forEach(textDraw => textDraw.dispose());

        if (this.#globalTextDraws_.size != 0)
            throw new Error('There are remaining global text draws after disposing all of them.');

        if (this.#playerTextDraws_.size != 0)
            throw new Error('There are remaining player text draws after disposing all of them.');
    }
}
