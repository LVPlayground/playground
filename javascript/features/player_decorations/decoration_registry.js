// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Decoration } from 'features/player_decorations/decoration.js';

// File in which the available decorations have been specified.
const kFilename = 'data/player_decorations.json';

// Has the knowledge of the available player decorations, loaded from the JSON configuration, and
// amended with unique IDs based on additional customizations, such as scale and colour.
export class DecorationRegistry {
    // Categories of customizations that are available. These are hardcoded as it's not always
    // possible to combine multiple decorations with each other.
    static kCategoryHair = 'Hair';

    #categories_ = null;
    #decorations_ = null;

    // Initializes the available decorations. Will be called lazily the first time either individual
    // or categorized decoration information is requested.
    initializeDecorations() {
        this.#categories_ = new Map();
        this.#decorations_ = new Map();

        const configuration = JSON.parse(readFile(kFilename));

        // An array with the categories which could be represented in the JSON configuration.
        const kAvailableCategories = [
            DecorationRegistry.kCategoryHair,
        ];

        // (1) Iterate over the |kAvailableCategories|, and skip ones not known in the file.
        for (const category of kAvailableCategories) {
            if (!configuration.hasOwnProperty(category))
                continue;  // no decorations exist for the given category

            const decorations = new Set();

            // (2) Iterate over the decorations defined in that category, and instantiate an object.
            for (const decorationConfiguration of configuration[category]) {
                const decoration = new Decoration(decorationConfiguration);

                // (3) Store the |decoration| in the right category, and with its unique Id.
                this.#decorations_.set(decoration.uniqueId, decoration);

                decorations.add(decoration);
            }

            this.#categories_.set(category, decorations);
        }
    }

    // ---------------------------------------------------------------------------------------------

    // Returns an array of the categories which have decorations available, together with a count of
    // the number of decorations that are available within that category.
    getDecorationCategories() {
        if (this.#categories_ === null)
            this.initializeDecorations();

        const categories = [];

        for (const [ category, decorations ] of this.#categories_)
            categories.push({ category, decorationCount: decorations.size });

        return categories;
    }

    // Returns an array of all decorations that are part of the given |category|. A new array is
    // created for each invocation. If the |category| does not exist, an exception will be thrown.
    getDecorationsForCategory(category) {
        if (this.#categories_ === null)
            this.initializeDecorations();

        if (!this.#categories_.has(category))
            throw new Error(`Invalid decoration category given: ${category}`);

        return [ ...this.#categories_.get(category) ];
    }

    // Returns the decoration identified by the |uniqueId|, or undefined otherwise.
    getDecoration(uniqueId) {
        if (this.#decorations_ === null)
            this.initializeDecorations();

        return this.#decorations_.get(uniqueId);
    }
}
