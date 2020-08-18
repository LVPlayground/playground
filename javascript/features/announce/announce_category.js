// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Immutable version of an announcement category, generally defined in `announce_categories.js`.
// Will automatically substitute all missing information with sensible defaults.
export class AnnounceCategory {
    #defaultEnabled_ = false;
    #hidden_ = false;
    #identifier_ = null;
    #level_ = Player.LEVEL_PLAYER;
    #name_ = null;
    #nuwani_ = false;
    #prefix_ = null;

    // ---------------------------------------------------------------------------------------------

    // Gets the identifier through which this category is known.
    get identifier() { return this.#identifier_; }

    // Gets whether this category should be hidden in the configuration dialogs.
    get hidden() { return this.#hidden_; }

    // Gets the name of this category.
    get name() { return this.#name_; }

    // Gets the level requirement of this category. This cannot be overridden.
    get level() { return this.#level_; }

    // Gets the prefix that should be applied to this category.
    get prefix() { return this.#prefix_; }

    // Gets whether the announcement should be distributed to Nuwani as well.
    get nuwani() { return this.#nuwani_; }

    // Gets whether the category should be enabled by default.
    get defaultEnabled() { return this.#defaultEnabled_; }

    // ---------------------------------------------------------------------------------------------

    constructor(identifier, init) {
        this.#identifier_ = identifier;

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

        if (init.hasOwnProperty('nuwani') && init.nuwani)
            this.#nuwani_ = true;

        if (init.hasOwnProperty('hidden') && init.hidden)
            this.#hidden_ = true;
    }
}
