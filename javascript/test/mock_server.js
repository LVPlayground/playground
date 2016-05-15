// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const CommandManager = require('components/command_manager/command_manager.js');
const FeatureManager = require('components/feature_manager/feature_manager.js');
const MockPlayerManager = require('test/mock_player_manager.js');

// The MockServer is a mocked implementation of the Server class that creates a mocked environment
// having mocked connected players. It will automatically be created before running a test, and
// will be disposed afterwards. There should not be any need to instantiate this class manually.
class MockServer {
    // Constructs the MockServer instance, and creates a mocked scenario on the server.
    constructor() {
        // TODO(Russell): Create a mocked database.
        this.database_ = null;

        this.commandManager_ = new CommandManager();
        this.featureManager_ = new FeatureManager();
        this.playerManager_ = new MockPlayerManager();

        // Connect a series of fake players to the server.
        [
            { playerid: 0, name: 'Gunther' },
            { playerid: 1, name: 'Russell' },
            { playerid: 2, name: 'Lucy' }

        ].forEach(event => this.playerManager_.onPlayerConnect(event));
    }

    // Gets the command manager. This is a real instance.
    get commandManager() { return this.commandManager_; }

    // Gets the feature manager. This is a real instance.
    get featureManager() { return this.featureManager_; }

    // Gets the mocked player manager.
    get playerManager() { return this.playerManager_; }

    // Gets the mocked database.
    get database() { return this.database_; }

    // Returns whether the current Server instance is used for testing. Should be using sparsely,
    // prefer injecting mocks where possible.
    isTest() { return true; }

    // Disposes the MockServer and uninitializes all owned objects.
    dispose() {
        this.playerManager_.dispose();
        this.featureManager_.dispose();
        this.commandManager_.dispose();
    }
}

exports = MockServer;
