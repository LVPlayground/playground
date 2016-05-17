// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ActorManager = require('entities/actor_manager.js');
const CommandManager = require('components/command_manager/command_manager.js');
const FeatureManager = require('components/feature_manager/feature_manager.js');
const MockActor = require('test/mock_actor.js');
const MockPlayerManager = require('test/mock_player_manager.js');
const MockVehicle = require('test/mock_vehicle.js');
const VehicleManager = require('entities/vehicle_manager.js');

// The MockServer is a mocked implementation of the Server class that creates a mocked environment
// having mocked connected players. It will automatically be created before running a test, and
// will be disposed afterwards. There should not be any need to instantiate this class manually.
class MockServer {
    // Constructs the MockServer instance, and creates a mocked scenario on the server.
    constructor() {
        this.commandManager_ = new CommandManager();
        this.featureManager_ = new FeatureManager();

        this.actorManager_ = new ActorManager(MockActor /* actorConstructor */);
        this.playerManager_ = new MockPlayerManager();
        this.vehicleManager_ = new VehicleManager(MockVehicle /* vehicleConstructor */);

        // Connect a series of fake players to the server.
        [
            { playerid: 0, name: 'Gunther' },
            { playerid: 1, name: 'Russell' },
            { playerid: 2, name: 'Lucy' }

        ].forEach(event => this.playerManager_.onPlayerConnect(event));
    }

    // ---------------------------------------------------------------------------------------------

    // Gets the database. Will throw an exception because it's not available in tests.
    get database() { throw new Error('The database is not available in tests.'); }

    // ---------------------------------------------------------------------------------------------

    // Gets the command manager. This is a real instance.
    get commandManager() { return this.commandManager_; }

    // Gets the feature manager. This is a real instance.
    get featureManager() { return this.featureManager_; }

    // ---------------------------------------------------------------------------------------------

    // Gets the real actor manager that maintains mocked actors.
    get actorManager() { return this.actorManager_; }

    // Gets the mocked player manager.
    get playerManager() { return this.playerManager_; }

    // Gets the real vehicle manager that maintains mocked vehicles.
    get vehicleManager() { return this.vehicleManager_; }

    // ---------------------------------------------------------------------------------------------

    // Returns whether the Server instance is used to drive tests.
    isTest() { return true; }

    // ---------------------------------------------------------------------------------------------

    // Disposes the MockServer and uninitializes all owned objects.
    dispose() {
        this.vehicleManager_.dispose();
        this.playerManager_.dispose();
        this.actorManager_.dispose();

        this.featureManager_.dispose();
        this.commandManager_.dispose();
    }
}

exports = MockServer;
