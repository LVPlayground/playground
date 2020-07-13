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

    abandonBehaviour_ = null;
    manager_ = null;

    constructor(manager, abandonBehaviour = SpectateGroup.kStopAbandonBehaviour) {
        this.abandonBehaviour_ = abandonBehaviour;
        this.manager_ = manager;
    }

    // Gets what behaviour should be applied when players watch someone that's being removed from
    // this group. Will be one of the static constants at the top of this class.
    get abandonBehaviour() { return this.abandonBehaviour_; }

    // Adds the given |player| to the group.
    addPlayer(player) {}

    // Removes the given |player| from the group.
    removePlayer(player) {}

    dispose() {

    }
}
