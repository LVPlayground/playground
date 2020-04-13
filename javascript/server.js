// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import ActorManager from 'entities/actor_manager.js';
import Clock from 'base/clock.js';
import CommandManager from 'components/command_manager/command_manager.js';
import Database from 'components/database/database.js';
import FeatureManager from 'components/feature_manager/feature_manager.js';
import NpcManager from 'entities/npc_manager.js';
import ObjectManager from 'entities/object_manager.js';
import PickupManager from 'entities/pickup_manager.js';
import PlayerManager from 'entities/player_manager.js';
import TextLabelManager from 'entities/text_label_manager.js';
import VehicleManager from 'entities/vehicle_manager.js';
import VirtualWorldManager from 'entities/virtual_world_manager.js';

// The Server object is the global instance of the Las Venturas Playground run-time. It is globally
// available and exposes an interface that enables any aspect of the server to be changed.
class Server {
    constructor() {
        this.database_ = new Database();
        this.clock_ = new Clock();

        this.commandManager_ = new CommandManager();
        this.featureManager_ = new FeatureManager();

        this.actorManager_ = new ActorManager();
        this.objectManager_ = new ObjectManager();
        this.pickupManager_ = new PickupManager();
        this.playerManager_ = new PlayerManager();
        this.textLabelManager_ = new TextLabelManager();
        this.vehicleManager_ = new VehicleManager();
        this.virtualWorldManager_ = new VirtualWorldManager();

        this.npcManager_ = new NpcManager(Npc, this.playerManager_);

        // TODO(Russell): The DialogManager should be owned by the Server instance.
    }

    // ---------------------------------------------------------------------------------------------

    // Gets the connection to the Las Venturas Playground database.
    get database() { return this.database_; }

    // Gets the clock that can be used for getting the current time.
    get clock() { return this.clock_; }

    // ---------------------------------------------------------------------------------------------

    // Gets the global command manager that owns all commands available to players.
    get commandManager() { return this.commandManager_; }

    // Gets the feature manager, which is responsible for tracking all enabled features.
    get featureManager() { return this.featureManager_; }

    // ---------------------------------------------------------------------------------------------

    // Gets the global actor manager, responsible for all actors in the game.
    get actorManager() { return this.actorManager_; }

    // Gets the global NPC manager, responsible for creating NPCs on the server.
    get npcManager() { return this.npcManager_; }

    // Gets the global object manager, responsible for all objects created in the game.
    get objectManager() { return this.objectManager_; }

    // Gets the global pickup manager that allows creation of pickups.
    get pickupManager() { return this.pickupManager_; }

    // Gets the global player manager that knows the details and whereabouts of all in-game players.
    get playerManager() { return this.playerManager_; }

    // Gets the global text label manager, that allows creation of text labels.
    get textLabelManager() { return this.textLabelManager_; }

    // Gets the vehicle manager that controls all vehicles on the server.
    get vehicleManager() { return this.vehicleManager_; }

    // Gets the Virtual World manager, responsible for allocating virtual worlds.
    get virtualWorldManager() { return this.virtualWorldManager_; }

    // ---------------------------------------------------------------------------------------------

    // Returns whether the Server instance is used to drive tests.
    isTest() { return false; }

    // ---------------------------------------------------------------------------------------------

    // Disposes and uninitializes the server object and all objects owned by it.
    async dispose() {
        this.featureManager_.dispose();
        this.commandManager_.dispose();

        await this.npcManager_.dispose();

        this.virtualWorldManager_.dispose();
        this.vehicleManager_.dispose();
        this.textLabelManager_.dispose();
        this.playerManager_.dispose();
        this.pickupManager_.dispose();
        this.objectManager_.dispose();
        this.actorManager_.dispose();

        this.clock_.dispose();
        this.database_.dispose();
    }
}

export default Server;

// The Server object is exposed on the global scope. It must, however, be instantiated manually when
// the test runner has finished verifying the state of the gamemode.
global.server = null;
