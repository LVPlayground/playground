// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Class that describes a player's state while they're spectating.
export class SpectateState {
    // The SpectateGroup that the owner of this instance is spectating.
    group = null;

    // The target within the group that the owner is supposed to be spectating.
    target = null;

    // The entity (either Player or Vehicle instance) that the owner is actually watching.
    targetEntity = null;

    constructor(group, target) {
        this.group = group;
        this.target = target;
    }
}
