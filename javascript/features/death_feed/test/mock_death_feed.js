// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Feature } from 'components/feature_manager/feature.js';

// Implementation of the DeathFeed feature that follows the exact same API, but does not actually
// interact with the San Andreas: Multiplayer server.
class MockDeathFeed extends Feature {
    constructor() {
        super();

        this.disabledPlayers_ = new Set();
    }

    isDisabledForPlayer(player) {
        return this.disabledPlayers_.has(player);
    }

    disableForPlayer(player) {
        this.disabledPlayers_.add(player);
    }

    enableForPlayer(player) {
        this.disabledPlayers_.delete(player);
    }

    sendDeathMessage(player, killee, killer, reason) {}
}

export default MockDeathFeed;
