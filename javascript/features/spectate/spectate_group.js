// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Represents a group of players that can be spectated. This could either be all players on the
// server (i.e. for administrators), but can also be a subset thereof in case spectation is enabled
// for games or other features.
export class SpectateGroup {
    // Behaviours that can be applied when watching someone in this group who's being removed from
    // it. Either the watcher will stop watching, or they'll switch to the next person in the group.
    static kStopAbandonBehaviour = 0;
    static kSwitchAbandonBehaviour = 1;

    #abandonBehaviour_ = null;
    #manager_ = null;
    #players_ = null;

    constructor(manager, abandonBehaviour = SpectateGroup.kStopAbandonBehaviour) {
        this.#abandonBehaviour_ = abandonBehaviour;
        this.#manager_ = manager;
        this.#players_ = new Set();
    }

    // Gets what behaviour should be applied when players watch someone that's being removed from
    // this group. Will be one of the static constants at the top of this class.
    get abandonBehaviour() { return this.#abandonBehaviour_; }

    // Gets the number of players who are part of this group. May be zero.
    get size() { return this.#players_.size; }

    // Provides access to the players through an iterator.
    [Symbol.iterator]() { return this.#players_.values(); }

    // Adds the given |player| to the group.
    addPlayer(player) {
        this.#players_.add(player);
        this.#manager_.onGroupUpdated(this);
    }

    // Returns whether the given |player| is part of this group.
    hasPlayer(player) { return this.#players_.has(player); }

    // Removes the given |player| from the group.
    removePlayer(player) {
        this.#players_.delete(player);
        this.#manager_.onGroupUpdated(this);
    }

    dispose() {
        this.#players_.clear();
        this.#players_ = null;

        this.#manager_ = null;
    }
}
