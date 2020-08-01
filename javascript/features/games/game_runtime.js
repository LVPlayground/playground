// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { GameActivity } from 'features/games/game_activity.js';
import { ScopedEntities } from 'entities/scoped_entities.js';
import { SpectateGroup } from 'features/spectate/spectate_group.js';

import { showCountdownForPlayer } from 'features/games/game_countdown.js';

// Provides the runtime for hosting a Game instance, i.e. takes care of forwarding the appropriate
// events, manages players and lifetimes of objects, vehicles and other entities.
export class GameRuntime extends GameActivity {
    // The states in lifetime progression the game runtime supports.
    static kStateUninitialized = 0;
    static kStateInitialized = 1;
    static kStateRunning = 2;
    static kStateFinished = 3;
    static kStateFinalized = 4;

    description_ = null;
    finance_ = null;
    manager_ = null;
    nuwani_ = null;
    settings_ = null;
    spectate_ = null;
    state_ = null;
    virtualWorld_ = null;

    loserCount_ = 0;
    playerCount_ = 0;
    winnerCount_ = 0;

    players_ = null;
    prizeMoney_ = 0;
    scopedEntities_ = null;
    spawned_ = new WeakSet();
    spectateGroup_ = null;

    // The actual game instance that contains the logic.
    game_ = null;

    // Gets the GameDescription instance that describes what we're running here.
    get description() { return this.description_; }

    // Gets the set of players who are currently in the game. Exposed to the Game.
    get players() { return this.players_; }

    // Gets the settings map that defines how this game should be ran.
    get settingsForTesting() { return this.settings_; }

    // Getst the state the game is in. Only exposed for testing purposes.
    get state() { return this.state_; }

    // Gets the virtual world that has bene allocated to this game.
    get virtualWorld() { return this.virtualWorld_; }

    constructor(manager, description, settings, finance, nuwani, spectate, virtualWorld = 0) {
        super();

        this.description_ = description;
        this.finance_ = finance;
        this.manager_ = manager;
        this.nuwani_ = nuwani;
        this.settings_ = settings;
        this.spectate_ = spectate;
        this.state_ = GameRuntime.kStateUninitialized;
        this.virtualWorld_ = virtualWorld;
    }

    // ---------------------------------------------------------------------------------------------

    // Initializes the game by creating the instance and waiting for it to fully initialize.
    // Players will be added immediately after initialization has completed.
    async initialize() {
        if (this.state_ != GameRuntime.kStateUninitialized)
            throw new Error(`Initialization must only happen immediately following construction.`);
        
        // (1) Set to maintain all the participants who are part of this game.
        this.players_ = new Set();

        // (2) A ScopedEntities object on which all of the game's entities should be created.
        this.scopedEntities_ = new ScopedEntities({
            interiorId: -1,  // all interiors
            virtualWorld: this.virtualWorld_,
        });

        // (3) A spectate group, in case people or participants want to watch the game. Players
        // watch a game rather than a particular participant, so if a participant leaves, watchers
        // should move to the next participant in the game.
        this.spectateGroup_ = this.spectate_().createGroup(SpectateGroup.kSwitchAbandonBehaviour);

        // (4) The Game instance itself, initialized through its constructor.
        this.game_ = new this.description_.gameConstructor(this, this.scopedEntities_);

        await this.game_.onInitialized(this.settings_, this.description_.userData);

        this.state_ = GameRuntime.kStateInitialized;
    }

    // Actually runs the game, and will not return until all players have left the game, either by
    // winning, losing, disconnecting or otherwise. Be creative.
    async run() {
        if (this.state_ != GameRuntime.kStateInitialized)
            throw new Error(`The runtime is only able to run after initialization.`);

        this.playerCount_ = this.players_.size;
        this.state_ = GameRuntime.kStateRunning;

        const spawnPromises = [];
        for (const player of this.players_)
            spawnPromises.push(this.onPlayerSpawn(player));

        await Promise.all(spawnPromises);

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

        this.spectate_().deleteGroup(this.spectateGroup_);
        this.spectateGroup_ = null;

        this.scopedEntities_.dispose();
        this.scopedEntities_ = null;

        this.state_ = GameRuntime.kStateFinalized;
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the |player| is being added to the game.
    async addPlayer(player, contribution) {
        if (![ GameRuntime.kStateInitialized, GameRuntime.kStateRunning ].includes(this.state_))
            throw new Error('Players may only be added to the game while it is running.');

        this.prizeMoney_ += contribution;

        // Serialize the |player|'s state so that we can take them back after the game.
        player.serializeState(/* restoreOnSpawn= */ false);
        
        // Add the |player| to the list of folks who can be watched.
        this.spectateGroup_.addPlayer(player);

        // Tell the manager about the player now being engaged in this game.
        this.manager_.setPlayerActivity(player, this);
        this.players_.add(player);

        // Formally introduce the |player| to the game.
        await this.game_.onPlayerAdded(player);
    }

    // Called when the |player| has to be removed from the game, either because they disconnected,
    // were forced out by an administrator, or chose to execute `/leave` themselves.
    async removePlayer(player, disconnecting = false) {
        if (this.state_ != GameRuntime.kStateRunning)
            throw new Error('Players may only be removed from the game while it is running.');

        // First remove the |player| from the game.
        await this.game_.onPlayerRemoved(player);

        // Remove the |player| from the list of folks who can be watched.
        this.spectateGroup_.removePlayer(player);

        this.manager_.setPlayerActivity(player, null);
        this.players_.delete(player);

        // Restore the |player|'s state -- back as if nothing ever happened.
        if (!disconnecting)
            player.restoreState();
    }

    // ---------------------------------------------------------------------------------------------
    // Events relevant to this game
    // ---------------------------------------------------------------------------------------------

    // Called when the |player| has died, possibly by action of the |killer|.
    onPlayerDeath(player, killer, reason) {
        if (!this.players_.has(player))
            throw new Error(`Received "playerdeath" event for an unknown player: ${player}`);
        
        this.game_.onPlayerDeath(player, killer, reason);
    }

    // Called when the |player| is spawning in the world, while playing in this game.
    async onPlayerSpawn(player) {
        let countdown = undefined;

        // Make sure that the |player| is in the right virtual world.
        player.virtualWorld = this.virtualWorld_;

        // Bind the countdown for |player| is this has been configured, and this is first spawn.
        if (this.description_.countdown && !this.spawned_.has(player))
            countdown = showCountdownForPlayer.bind(null, player, this.description);

        // Let the game do their magic when the player's ready.
        await this.game_.onPlayerSpawned(player, countdown);

        this.spawned_.add(player);
    }

    // ---------------------------------------------------------------------------------------------
    // API available to the Game implementation.
    // ---------------------------------------------------------------------------------------------

    // Signals that the |player| has lost. They will be removed from the game.
    async playerLost(player, score = null) {
        const position = this.playerCount_ - this.loserCount_++;

        // TODO: Store the |player|'s |score|, and the fact that they lost. (w/ rank)

        // Confirms the result with the given |player|, and award prize money, if any.
        this.confirmResultWithPlayer(player, score, position);

        await this.removePlayer(player);
    }

    // Signals that the |player| has won. They will be removed from the game.
    async playerWon(player, score = null) {
        const position = ++this.winnerCount_;

        // TODO: Store the |player|'s |score|, and the fact that they won. (w/ rank)

        // Confirms the result with the given |player|, and award prize money, if any.
        this.confirmResultWithPlayer(player, score, position);

        await this.removePlayer(player);
    }

    // Immediately stops the game, and removes all players. None of the players will be considered
    // either winners or losers, and their data will not be recorded.
    async stop() {
        for (const player of this.players_)
            await this.removePlayer(player);
    }

    // ---------------------------------------------------------------------------------------------
    // Utility functions (internal)
    // ---------------------------------------------------------------------------------------------

    // Confirms the results of the game with the |player|, who's just dropped out, and awards them
    // with their share of the prize money if they've deserved any.
    confirmResultWithPlayer(player, score, position) {
        const positionOrdinal = ['st','nd','rd'][((position + 90) % 100 - 10) % 10 - 1] || 'th';

        const award = this.calculatePrizeMoneyShare();
        const name = this.description_.nameFn(this.settings_);

        let formattedScore = '';
        if (score !== null)
            formattedScore = ', ' + this.description_.formatScore(score);

        player.sendMessage(
            Message.GAME_RESULT_FINISHED, name, position, positionOrdinal, formattedScore);

        this.nuwani_().echo(
            'notice-minigame-win', player.name, player.id, name, position,
            positionOrdinal, formattedScore);

        // Inform and award the |player| of their |award|, if any.
        if (award === 0)
            return;

        this.finance_().givePlayerCash(player, award);

        player.sendMessage(Message.GAME_RESULT_FINISHED_AWARD, award);
    }

    // Calculates the share of prize money that the next player who's to leave the game will
    // receive. This depends on the number of participants in the game:
    //
    // * Single player: no money will be awarded at all.
    // * Two players: winner takes all
    // * Three players: 75%, 25%, nothing
    // * Four or more players: 70%, 20%, 10%, nothing...
    calculatePrizeMoneyShare() {
        const remainingPlayers = this.players_.size;
        switch (this.playerCount_) {
            case 1:
                return 0;  // no money will be awarded

            case 2:
                if (remainingPlayers === 1)
                    return this.prizeMoney_;  // the winner
                
                return 0;  // the loser, no money will be awarded

            case 3:
                if (remainingPlayers === 2)
                    return Math.floor(this.prizeMoney_ * 0.25);  // 2nd position
                if (remainingPlayers === 1)
                    return Math.floor(this.prizeMoney_ * 0.75);  // the winner
                
                return 0;  // 3rd position, no money will be awarded

            default:
                if (remainingPlayers === 3)
                    return Math.floor(this.prizeMoney_ * 0.1);  // 3rd position
                if (remainingPlayers === 2)
                    return Math.floor(this.prizeMoney_ * 0.2);  // 2nd position
                if (remainingPlayers === 1)
                    return Math.floor(this.prizeMoney_ * 0.7);  // 1st position
                
                return 0;  // 4th or worse position, no money will be awarded
        }
    }

    // ---------------------------------------------------------------------------------------------
    // GameActivity implementation
    // ---------------------------------------------------------------------------------------------

    getActivityState() { return GameActivity.kStateEngaged; }
    getActivityName() { return this.description_.nameFn(this.settings_); }
}
