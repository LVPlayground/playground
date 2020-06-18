// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Minimal object mimicking the API of PlayerAnimation specifically to power the /dance command,
// which follows a slightly different syntax from the others, but is very popular.
export class DanceAnimation {
    #action_ = null;

    constructor(action) {
        this.#action_ = action;
    }

    get command() { return 'dance'; }
    get description() { return 'Makes your character dance!'; }

    // ---------------------------------------------------------------------------------------------

    execute(player) { player.specialAction = this.#action_; }

    // ---------------------------------------------------------------------------------------------

    toString() { return `[object DanceAnimation(${this.#action_})]`; }
}
