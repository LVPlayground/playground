// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Minigame = require('features/minigames/minigame.js');
const MinigameDriver = require('features/minigames/minigame_driver.js');

// The minigame manager keeps track of the states of all players and all minigames, and routes
// events associated with these entities to the right places. Each type of minigame gets a category
// through which its active minigames can be retrieved.
class MinigameManager {
    constructor() {
        // Map of category symbol to description for the given category.
        this.categories_ = new Map();

        // Map of category symbol to a set containing all minigame drivers that are currently in
        // progress for the given category. 
        this.minigames_ = new Map();

        // Map of player instance to the driver of the minigame they are engaged in.
        this.players_ = new Map();

        // Observe player disconnection events which are of interest to the manager.
        server.playerManager.addObserver(this);
    }

    // Creates a new minigame category. The category is guaranteed to be unique, but will only serve
    // as a completely opaque token to the implementing feature. Note that the |description| is not
    // currently used for anything, only stored in case of left-over categories.
    createCategory(description) {
        const category = Symbol(description);

        this.categories_.set(category, description);
        this.minigames_.set(category, new Set());

        return category;
    }

    // Wraps the |minigame| in the supporting driver and stores it for |category|. The |player| will
    // automatically be added to the driver, given that minigames cannot go without players.
    createMinigame(category, minigame, player) {
        if (!this.categories_.has(category))
            throw new Error('Invalid category: ' + category);

        if (!(minigame instanceof Minigame))
            throw new Error('Only games for Minigame objects can be created by the manager.');

        if (this.isPlayerEngaged(player))
            throw new Error('Players can only be involved in a single minigame at a time.');

        const driver = new MinigameDriver(this, category, minigame);
        driver.addPlayer(player);

        // Associate the |driver| with the |category|.
        this.minigames_.get(category).add(driver);

        // Associate the |driver| with the |player|.
        this.players_.set(player, driver);      
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
            throw new Error('Invalid category: ' + category);

        if (driver.activePlayers.size > 0)
            throw new Error('The |driver| still has active players associated with it.');

        this.minigames_.get(category).delete(driver);
    }

    // Deletes the minigame |category|. All minigames associated with it will be forcefully stopped,
    // and all players part of these minigames will be respawned.
    deleteCategory(category) {
        if (!this.categories_.has(category))
            throw new Error('Invalid category: ' + category);

        // TODO(Russell): Cancel any minigames running as part of this category.

        this.minigames_.delete(category);
        this.categories_.delete(category);
    }

    // Returns a list of minigames that are currently running for the |category|. The actual game
    // instances will be returned rather than the drivers managed by this feature.
    getMinigamesForCategory(category) {
        if (!this.categories_.has(category))
            throw new Error('Invalid category: ' + category);

        let minigames = [];

        this.minigames_.get(category).forEach(driver =>
            minigames.push(driver.minigame));

        return minigames;
    }

    // Returns the name of the minigame the |player| is involved in, or NULL when they are not
    // involved in any minigame at all.
    getMinigameNameForPlayer(player) {
        if (!this.players_.has(player))
            return null;

        return this.players_.get(player).minigame.name
    }

    // Returns whether the player is currently ingaged in a minigame.
    isPlayerEngaged(player) {
        return this.players_.has(player);
    }

    // Called when |player| has disconnected from Las Venturas Playground. They will automatically
    // be removed from any minigame they were previously part of.
    onPlayerDisconnect(player) {
        const driver = this.players_.get(player);
        if (!driver)
            return;

        driver.removePlayer(player, Minigame.REASON_DISCONNECT);
    }

    dispose() {
        server.playerManager.removeObserver(this);

        this.players_ = null;
        this.minigames_ = null;
        this.categories_ = null;
    }
}

exports = MinigameManager;
