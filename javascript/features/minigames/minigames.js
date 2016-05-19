// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Feature = require('components/feature_manager/feature.js');
const MinigameManager = require('features/minigames/minigame_manager.js');

// This class exposes an API that enables minigame features to build upon common infrastructure for
// the mechanical pieces of maintaining such a feature.
class Minigames extends Feature {
    constructor() {
        super();

        // Minigames depend on the announce feature to announce availability and participation.
        const announce = this.defineDependency('announce');

        // Minigames depend on the death feed in order to be able to hide this for players.
        const deathFeed = this.defineDependency('deathFeed');

        this.manager_ = new MinigameManager(announce, deathFeed);
    }

    // ---------------------------------------------------------------------------------------------
    // Public API of the minigame feature.
    // ---------------------------------------------------------------------------------------------

    // Creates a new, opaque token for the category of minigames described by |description|. When
    // given, the |observer| will be informed about created, started and finished minigames. The
    // |observer| must extend the MinigameObserver class.
    createCategory(description, observer = null) {
        return this.manager_.createCategory(description, observer);
    }

    // Returns an array of minigames that are currently in-progress for the |category|.
    getMinigamesForCategory(category) {
        return this.manager_.getMinigamesForCategory(category);
    }

    // Deletes the minigame |category|. All associated minigames will be stopped as well. Will throw
    // an exception if |category| has not been previously created.
    deleteCategory(category) {
        this.manager_.deleteCategory(category);
    }

    // ---------------------------------------------------------------------------------------------

    // Returns whether the |player| is currently involved in any minigame.
    isPlayerEngaged(player) {
        return this.manager_.isPlayerEngaged(player);
    }

    // Returns the name of the minigame |player| is involved in, or NULL when they are not currently
    // involved in any minigame at all.
    getMinigameNameForPlayer(player) {
        return this.manager_.getMinigameNameForPlayer(player);
    }

    // ---------------------------------------------------------------------------------------------

    // Creates the supporting infrastructure around |minigame|. The |player| is the initiating
    // player for whom the minigame has been created.
    createMinigame(category, minigame, player) {
        this.manager_.createMinigame(category, minigame, player);
    }

    // Adds |player| to the |minigame| belonging to |category|.
    addPlayerToMinigame(category, minigame, player) {
        this.manager_.addPlayerToMinigame(category, minigame, player);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.manager_.dispose();
        this.manager_ = null;
    }
}

exports = Minigames;
