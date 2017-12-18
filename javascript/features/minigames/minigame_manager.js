// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Minigame from 'features/minigames/minigame.js';
import MinigameDriver from 'features/minigames/minigame_driver.js';
import ScopedCallbacks from 'base/scoped_callbacks.js';

// Number of milliseconds player have to sign-up to another player's minigame.
const SignupTimeoutMilliseconds = 20000;

// The minigame manager keeps track of the states of all players and all minigames, and routes
// events associated with these entities to the right places. Each type of minigame gets a category
// through which its active minigames can be retrieved.
class MinigameManager {
    constructor(announce, deathFeed) {
        this.announce_ = announce;
        this.deathFeed_ = deathFeed;

        // Set containing the registered categories.
        this.categories_ = new Set();

        // Map of category symbol to a set containing all minigame drivers that are currently in
        // progress for the given category.
        this.minigames_ = new Map();

        // Map of player instance to the driver of the minigame they are engaged in.
        this.players_ = new Map();

        // Observe the entity managers for events which are of interest to the manager.
        server.playerManager.addObserver(this);
        server.vehicleManager.addObserver(this);

        // Listen to other events relevant for accurately managing minigame state.
        this.callbacks_ = new ScopedCallbacks();
        this.callbacks_.addEventListener(
            'playerdeath', MinigameManager.prototype.onPlayerDeath.bind(this));
        this.callbacks_.addEventListener(
            'playerleaveactivity', MinigameManager.prototype.onPlayerLeaveActivity.bind(this));
        this.callbacks_.addEventListener(
            'playerspawn', MinigameManager.prototype.onPlayerSpawn.bind(this));
        this.callbacks_.addEventListener(
            'playerstatechange', MinigameManager.prototype.onPlayerStateChange.bind(this));
    }

    // Gets the death feed feature available to drivers to toggle a player's death feed. Should not
    // be cached because the underlying DeathFeed implementation may change.
    get deathFeed() { return this.deathFeed_(); }

    // ---------------------------------------------------------------------------------------------

    // Creates a new minigame category. The category is guaranteed to be unique, but will only serve
    // as a completely opaque token to the implementing feature.
    createCategory(description) {
        const category = Symbol(description);

        this.categories_.add(category);
        this.minigames_.set(category, new Set());

        return category;
    }

    // Returns a list of minigames that are currently running for the |category|. The actual game
    // instances will be returned rather than the drivers managed by this feature.
    getMinigamesForCategory(category) {
        if (!this.categories_.has(category))
            throw new Error('Invalid category.');

        let minigames = [];

        this.minigames_.get(category).forEach(driver =>
            minigames.push(driver.minigame));

        return minigames;
    }

    // Deletes the minigame |category|. All minigames associated with it will be forcefully stopped,
    // and all players part of these minigames will be respawned.
    deleteCategory(category) {
        if (!this.categories_.has(category))
            throw new Error('Invalid category.');

        const drivers = this.minigames_.get(category);
        const pending = [];

        // Finishing minigames is an asynchronous process, so wait until all running drivers signal
        // that it's safe to delete the category before doing so.
        drivers.forEach(driver =>
            pending.push(driver.finish(Minigame.REASON_FORCED_STOP)));

        return Promise.all(pending).then(() => {
            if (!this.minigames_)
                return;  // the minigame manager has been disposed of since

            this.minigames_.delete(category);
            this.categories_.delete(category);
        });
    }

    // ---------------------------------------------------------------------------------------------

    // Returns whether the player is currently ingaged in a minigame.
    isPlayerEngaged(player) {
        return this.players_.has(player);
    }

    // Returns the name of the minigame the |player| is involved in, or NULL when they are not
    // involved in any minigame at all.
    getMinigameNameForPlayer(player) {
        if (!this.players_.has(player))
            return null;

        return this.players_.get(player).minigame.settings.name;
    }

    // ---------------------------------------------------------------------------------------------

    // Wraps the |minigame| in the supporting driver and stores it for |category|. The |player| will
    // automatically be added to the driver, given that minigames cannot go without players.
    createMinigame(category, minigame, player) {
        if (!this.categories_.has(category))
            throw new Error('Invalid category.');

        if (!(minigame instanceof Minigame))
            throw new Error('Only games for Minigame objects can be created by the manager.');

        if (this.isPlayerEngaged(player))
            throw new Error('Players can only be involved in a single minigame at a time.');

        const driver = new MinigameDriver(this, category, minigame);
        const settings = minigame.settings;

        // Associate the |player| with the |driver|.
        driver.addPlayer(player);

        // Associate the |driver| with the |player|.
        this.players_.set(player, driver);

        // Associate the |driver| with the |category|.
        this.minigames_.get(category).add(driver);

        if (false) {
            // TODO(Russell): Skip the sign-up phase when the |player| is the only eligable player
            // on the server for joining this minigame.
        } else {
            this.announce_().announceMinigame(player, settings.name, settings.command);
            this.announce_().announceMinigameParticipation(player, settings.name, settings.command);

            if (!server.isTest())
                wait(SignupTimeoutMilliseconds).then(() => driver.load());
        }
    }

    // Adds |player| to the minigame. The minigame must have been created already, and the |player|
    // must not be engaged with any other activities.
    addPlayerToMinigame(category, minigame, player) {
        if (!this.categories_.has(category))
            throw new Error('Invalid category.');

        if (this.isPlayerEngaged(player))
            throw new Error('Players can only be involved in a single minigame at a time.');

        const settings = minigame.settings;

        for (const driver of this.minigames_.get(category)) {
            if (driver.minigame !== minigame)
                continue;

            // Associate the |player| with the |driver|.
            driver.addPlayer(player);

            // Associate the |driver| with the |player|.
            this.players_.set(player, driver);

            this.announce_().announceMinigameParticipation(player, settings.name, settings.command);
            return;
        }

        // The minigame was not found if we reach this location in the execution flow.
        throw new Error('Invalid minigame: ' + minigame);
    }

    // Called when |player| has been removed from the minigame they were part of. Should clear their
    // associated state in the minigame manager, which allows them to engage in another activity.
    didRemovePlayerFromMinigame(player) {
        this.players_.delete(player);
    }

    // Called when the |driver| has served its purpose and can be removed from the manager. This
    // means that the minigame has been finished.
    didFinishMinigame(category, driver) {
        if (!this.categories_.has(category))
            throw new Error('Invalid category.');

        if (driver.activePlayers.size > 0)
            throw new Error('The |driver| still has active players associated with it.');

        this.minigames_.get(category).delete(driver);

        driver.dispose();
    }

    // ---------------------------------------------------------------------------------------------

    // Called when a player has died. This may mean that they dropped out of the minigame.
    onPlayerDeath(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player || !this.players_.has(player))
            return;  // invalid player, or not engaged in a minigame

        this.players_.get(player).onPlayerDeath(player, event.reason);
    }

    // Called when |player| should be removed from any on-going activities.
    onPlayerLeaveActivity(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player || !this.players_.has(player))
            return;  // invalid player, or not engaged in a minigame

        const driver = this.players_.get(player);

        driver.removePlayer(player, Minigame.REASON_DROPPED_OUT);
    }

    // Called when |player| has disconnected from Las Venturas Playground. They will automatically
    // be removed from any minigame they were previously part of.
    onPlayerDisconnect(player) {
        const driver = this.players_.get(player);
        if (!driver)
            return;

        driver.removePlayer(player, Minigame.REASON_DISCONNECT);
    }

    // Called when a player has spawned. If they partake in a minigame that enables in-game respawns
    // then the event will be cancelled, and will never reach the Pawn code.
    onPlayerSpawn(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player || !this.players_.has(player))
            return;  // invalid player, or not engaged in a minigame

        if (this.players_.get(player).onPlayerSpawn(player))
            event.preventDefault();
    }

    // Called when a player's state changes. This powers the minigame events for players who enter
    // and leave their vehicles, which is important in, say, races.
    onPlayerStateChange(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player || !this.players_.has(player))
            return;  // invalid player, or not engaged in a minigame

        this.players_.get(player).onPlayerStateChange(player, event.newstate, event.oldstate);
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the |vehicle| has respawned on the server. Will be forwarded to the minigame
    // that owns |vehicle|, or will be ignored if that doesn't apply.
    onVehicleSpawn(vehicle) {
        this.minigames_.forEach(minigames =>
            minigames.forEach(driver => driver.onVehicleSpawn(vehicle)));
    }

    // Called when the |vehicle| has been destroyed. Will be forwarded to the minigame that owns
    // |vehicle|, or will be ignored if that doesn't apply.
    onVehicleDeath(vehicle) {
        this.minigames_.forEach(minigames =>
            minigames.forEach(driver => driver.onVehicleDeath(vehicle)));
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.callbacks_.dispose();

        server.vehicleManager.removeObserver(this);
        server.playerManager.removeObserver(this);

        this.players_ = null;
        this.minigames_ = null;
        this.categories_ = null;
    }
}

export default MinigameManager;
