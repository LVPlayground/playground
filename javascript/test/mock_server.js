// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const CommandManager = require('components/command_manager/command_manager.js');
const MockPlayerManager = require('test/mock_player_manager.js');

// Private symbol used to prevent MockServer from being instantiated.
const PrivateSymbol = Symbol('Do not construct the MockServer manually.');

// The MockServer is a mocked implementation of the Server class that creates a mocked environment
// having mocked connected players. It must be scoped to the lifetime of a test, so rather than
// instantiating this class yourself, use the bindTo() method in your tests.
class MockServer {
    // Makes sure that a global `server` variable is available for each test in the suite. The
    // |beforeEach| and |afterEach| arguments are passed to your describe() suite.
    static bindTo(beforeEach, afterEach, customBeforeFn = null, customAfterFn = null) {
        let storedServer = null;

        beforeEach(() => {
            storedServer = global.server;

            global.server = new MockServer(PrivateSymbol);
            if (customBeforeFn)
                customBeforeFn(global.server);
        });

        afterEach(() => {
            if (customAfterFn)
                customAfterFn();

            global.server.dispose();
            global.server = storedServer;
        });
    }

    // Constructs the MockServer instance, and creates a mocked player manager having various
    // mocked players.
    constructor(privateSymbol) {
        if (privateSymbol !== PrivateSymbol)
            throw new Error('The MockServer class must not be manually instantiated.');

        // TODO(Russell): Create a mocked database.
        this.database_ = null;

        this.commandManager_ = new CommandManager();
        this.playerManager_ = new MockPlayerManager();

        // Connect a series of fake players to the server.
        [
            { playerid: 0, name: 'Gunther' },
            { playerid: 1, name: 'Russell' }

        ].forEach(event => this.playerManager_.onPlayerConnect(event));
    }

    // Gets the command manager. This is a real instance.
    get commandManager() { return this.commandManager_; }

    // Gets the mocked player manager.
    get playerManager() { return this.playerManager_; }

    // Gets the mocked database.
    get database() { return this.database_; }

    // Disposes the MockServer and uninitializes all owned objects.
    dispose() {
        this.playerManager_.dispose();
        this.commandManager_.dispose();
    }
}

exports = MockServer;
