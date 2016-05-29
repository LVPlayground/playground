// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ActorManager = require('entities/actor_manager.js');
const CommandManager = require('components/command_manager/command_manager.js');
const FeatureManager = require('components/feature_manager/feature_manager.js');
const ObjectManager = require('entities/object_manager.js');
const PickupManager = require('entities/pickup_manager.js');
const PlayerManager = require('entities/player_manager.js');
const TextLabelManager = require('entities/text_label_manager.js');
const VehicleManager = require('entities/vehicle_manager.js');

const MockActor = require('entities/test/mock_actor.js');
const MockClock = require('base/test/mock_clock.js');
const MockObject = require('entities/test/mock_object.js');
const MockPickup = require('entities/test/mock_pickup.js');
const MockPlayer = require('entities/test/mock_player.js');
const MockTextLabel = require('entities/test/mock_text_label.js');
const MockVehicle = require('entities/test/mock_vehicle.js');

// The MockServer is a mocked implementation of the Server class that creates a mocked environment
// having mocked connected players. It will automatically be created before running a test, and
// will be disposed afterwards. There should not be any need to instantiate this class manually.
class MockServer {
    // Constructs the MockServer instance, and creates a mocked scenario on the server.
    constructor() {
        this.clock_ = new MockClock();

        this.commandManager_ = new CommandManager();
        this.featureManager_ = new FeatureManager();

        this.actorManager_ = new ActorManager(MockActor /* actorConstructor */);
        this.objectManager_ = new ObjectManager(MockObject /* objectConstructor */);
        this.pickupManager_ = new PickupManager(MockPickup /* pickupConstructor */);
        this.playerManager_ = new PlayerManager(MockPlayer /* playerConstructor */);
        this.textLabelManager_ = new TextLabelManager(MockTextLabel /* textLabelConstructor */);
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

    // Gets the clock. Returns real values, but has additional methods available for testing.
    get clock() { return this.clock_; }

    // ---------------------------------------------------------------------------------------------

    // Gets the command manager. This is a real instance.
    get commandManager() { return this.commandManager_; }

    // Gets the feature manager. This is a real instance.
    get featureManager() { return this.featureManager_; }

    // ---------------------------------------------------------------------------------------------

    // Gets the real actor manager that maintains mocked actors.
    get actorManager() { return this.actorManager_; }

    // Gets the real object manager that maintains mocked objects.
    get objectManager() { return this.objectManager_; }

    // Gets the real pickup manager that maintains mocked pickups.
    get pickupManager() { return this.pickupManager_; }

    // Gets the real player manager that maintains mocked players.
    get playerManager() { return this.playerManager_; }

    // Gets the real text label manager that maintains mocked text labels.
    get textLabelManager() { return this.textLabelManager_; }

    // Gets the real vehicle manager that maintains mocked vehicles.
    get vehicleManager() { return this.vehicleManager_; }

    // ---------------------------------------------------------------------------------------------

    // Returns whether the Server instance is used to drive tests.
    isTest() { return true; }

    // ---------------------------------------------------------------------------------------------

    // Disposes the MockServer and uninitializes all owned objects.
    dispose() {
        this.featureManager_.dispose();
        this.commandManager_.dispose();

        this.vehicleManager_.dispose();
        this.textLabelManager_.dispose();
        this.playerManager_.dispose();
        this.pickupManager_.dispose();
        this.objectManager_.dispose();
        this.actorManager_.dispose();

        this.clock_.dispose();
    }
}

exports = MockServer;
