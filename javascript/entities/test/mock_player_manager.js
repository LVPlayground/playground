// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const MockPlayer = require('entities/test/mock_player.js');
const PlayerManager = require('entities/player_manager.js');

// Mocked version of the PlayerManager. Supports the same interface and features as the real player
// manager, but works on fake data and fake players instead.
class MockPlayerManager extends PlayerManager {
    constructor() {
        super();

        // Dispose the callbacks- the mock does not have to listen to global events.
        this.callbacks_.dispose();
    }

    // Creates a new MockPlayer instance for the |playerId|. The |event| contains the additional
    // information made available by the MockServer, e.g. the player's name.
    createPlayer(playerId, event) {
        return new MockPlayer(playerId, event);
    }
}

exports = MockPlayerManager;
