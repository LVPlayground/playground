// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const PlayerManager = require('entities/player_manager.js');

// The Server object is the global instance of the Las Venturas Playground run-time. It is globally
// available and exposes an interface that enables any aspect of the server to be changed.
class Server {
    constructor() {
        this.playerManager_ = new PlayerManager();
    }

    // Gets the global player manager that knows the details and whereabouts of all in-game players.
    get playerManager() { return this.playerManager_; }

    // Disposes and uninitializes the server object and all objects owned by it.
    dispose() {
        this.playerManager_.dispose();
    }
}

// The Server object is exposed on the global scope.
global.server = new Server();
