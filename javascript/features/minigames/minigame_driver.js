// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// A minigame driver contains the information required to run an individual minigame. It will keep
// track of the engaged players, their states and will automatically unregister the minigame when
// no more players are engaged with it.
class MinigameDriver {
    constructor(manager, minigame) {
        this.manager_ = manager;
        this.minigame_ = minigame;
    }

    // Gets the minigame that has been wrapped by this driver.
    get minigame() { return this.minigame_; }
}

exports = MinigameDriver;
