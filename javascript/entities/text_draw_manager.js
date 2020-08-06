// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

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
