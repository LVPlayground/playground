// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { GameActivity } from 'features/games/game_activity.js';
import ScopedEntities from 'entities/scoped_entities.js';

// Provides the runtime for hosting a Game instance, i.e. takes care of forwarding the appropriate
// events, manages players and lifetimes of objects, vehicles and other entities.
export class GameRuntime extends GameActivity {
    // The states in lifetime progression the game runtime supports.
    static kStateUninitialized = 0;
    static kStateInitialized= 1;
    static kStateRunning = 2;
    static kStateFinished = 3;
    static kStateFinalized = 4;

    description_ = null;
    manager_ = null;
    state_ = null;

    players_ = null;
    scopedEntities_ = null;

    // The actual game instance that contains the logic.
    game_ = null;

    prizeMoney_ = null;

    // Gets the GameDescription instance that describes what we're running here.
    get description() { return this.description_; }

    // Gets the total amount of prize money available for the winner(s) of this game.
    get prizeMoney() { return this.prizeMoney_; }

    constructor(manager, description) {
        super();

        this.description_ = description;
        this.manager_ = manager;
        this.state_ = GameRuntime.kStateUninitialized;
    }

    // ---------------------------------------------------------------------------------------------

    // Initializes the game by creating the instance and waiting for it to fully initialize.
    // Players will be added immediately after initialization has completed.
    async initialize() {
        if (this.state_ != GameRuntime.kStateUninitialized)
            throw new Error(`Initialization must only happen immediately following construction.`);
        
        this.players_ = new Set();
        this.scopedEntities_ = new ScopedEntities({
            interiorId: -1,

            // TODO: Every game should have its own assigned virtual world
            virtualWorld: 1000,
        });

        this.game_ = new this.description_.gameConstructor(this, this.scopedEntities_);

        await this.game_.onInitialize();

        this.state_ = GameRuntime.kStateInitialized;
    }

    // Actually runs the game, and will not return until all players have left the game, either by
    // winning, losing, disconnecting or otherwise. Be creative.
    async run() {
        if (this.state_ != GameRuntime.kStateInitialized)
            throw new Error(`The runtime is only able to run after initialization.`);

        this.state_ = GameRuntime.kStateRunning;
        while (this.players_.size) {
            await this.game_.onTick();
            await wait(this.description_.tick);
        }

        this.state_ = GameRuntime.kStateFinished;
    }

    // Allows the game soem time to turn down its state.
    async finalize() {
        if (this.state_ != GameRuntime.kStateFinished)
            throw new Error(`The runtime cannot be finalized until the game has finished.`);

        await this.game_.onFinished();

        this.game_ = null;

        this.scopedEntities_.dispose();
        this.scopedEntities_ = null;

        this.state_ = GameRuntime.kStateFinalized;
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the |player| is being added to the game.
    async addPlayer(player) {
        if (![ GameRuntime.kStateInitialized, GameRuntime.kStateRunning ].includes(this.state_))
            throw new Error('Players may only be added to the game while it is running.');

        // TODO: Save the |player|'s current state.
        
        // Tell the manager about the player now being engaged in this game.
        this.manager_.setPlayerActivity(player, this);
        this.players_.add(player);

        // Formally introduce the |player| to the game.
        await this.game_.onPlayerAdded(player);
        await this.game_.onPlayerSpawned(player);
    }

    // Called when the |player| has to be removed from the game, either because they disconnected,
    // were forced out by an administrator, or chose to execute `/leave` themselves.
    async removePlayer(player, disconnecting) {
        if (this.state_ != GameRuntime.kStateRunning)
            throw new Error('Players may only be removed from the game while it is running.');

        // First remove the |player| from the game.
        await this.game_.onPlayerRemoved(player);

        // TODO: Let the game know that the |player| is leaving.
        // TODO: Restore the player's state.

        this.manager_.setPlayerActivity(player, null);
        this.players_.delete(player);
    }

    // ---------------------------------------------------------------------------------------------
    // API available to the Game implementation.
    // ---------------------------------------------------------------------------------------------

    // Signals that the |player| has lost. They will be removed from the game.
    playerLost(player, score) {

    }

    // Signals that the |player| has won. They will be removed from the game.
    playerWon(player, score) {

    }

    // Immediately stops the game, and removes all players.
    stop() {

    }

    // ---------------------------------------------------------------------------------------------
    // GameActivity implementation
    // ---------------------------------------------------------------------------------------------

    getActivityState() { return GameActivity.kStateEngaged; }
    getActivityName() { return this.description_.name; }
}