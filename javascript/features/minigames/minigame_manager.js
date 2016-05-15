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
            throw new Error('Invalid category passed: ' + category);

        if (!(minigame instanceof Minigame))
            throw new Error('Only games for Minigame objects can be created by the manager.');

        if (this.isPlayerEngaged(player))
            throw new Error('Players can only be involved in a single minigame at a time.');

        const driver = new MinigameDriver(this, minigame);

        // Associate the |driver| with the |category|.
        this.minigames_.get(category).add(driver);

        // Associate the |driver| with the |player|.
        this.players_.set(player, driver);      
    }

    // Deletes the minigame |category|. All minigames associated with it will be forcefully stopped,
    // and all players part of these minigames will be respawned.
    deleteCategory(category) {
        if (!this.categories_.has(category))
            throw new Error('Invalid category passed: ' + category);

        // TODO(Russell): Cancel any minigames running as part of this category.

        this.minigames_.delete(category);
        this.categories_.delete(category);
    }

    // Returns a list of minigames that are currently running for the |category|. The actual game
    // instances will be returned rather than the drivers managed by this feature.
    getMinigamesForCategory(category) {
        if (!this.categories_.has(category))
            throw new Error('Invalid category passed: ' + category);

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

    dispose() {
        this.players_ = null;
        this.minigames_ = null;
        this.categories_ = null;
    }
}

exports = MinigameManager;
