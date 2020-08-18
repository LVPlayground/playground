// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Immutable version of an announcement category, generally defined in `announce_categories.js`.
// Will automatically substitute all missing information with sensible defaults.
export class AnnounceCategory {
    #defaultEnabled_ = false;
    #level_ = Player.LEVEL_PLAYER;
    #name_ = null;
    #prefix_ = null;

    // ---------------------------------------------------------------------------------------------

    // Gets the name of this category.
    get name() { return this.#name_; }

    // Gets the level requirement of this category. This cannot be overridden.
    get level() { return this.#level_; }

    // Gets the prefix that should be applied to this category.
    get prefix() { return this.#prefix_; }

    // Gets whether the category should be enabled by default.
    get defaultEnabled() { return this.#defaultEnabled_; }

    // ---------------------------------------------------------------------------------------------

    constructor(init) {
        if (init.hasOwnProperty('defaultEnabled') && init.defaultEnabled)
            this.#defaultEnabled_ = true;
        else if (init.hasOwnProperty('defaultDisabled') && init.defaultDisabled)
            this.#defaultEnabled_ = false;

        if (init.hasOwnProperty('level'))
            this.#level_ = init.level;

        if (!init.hasOwnProperty('name'))
            throw new Error('Each announcement category must have a name.');

        this.#name_ = init.name;

        if (init.hasOwnProperty('prefix')) {
            if (typeof init.prefix !== 'function')
                throw new Error('Only the new message system is supported in categories.');

            this.#prefix_ = init.prefix;
        }
    }
}
