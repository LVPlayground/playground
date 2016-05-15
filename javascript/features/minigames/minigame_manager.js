// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The minigame manager keeps track of the states of all players and all minigames, and routes
// events associated with these entities to the right places. Each type of minigame gets a category
// through which its active minigames can be retrieved.
class MinigameManager {
    constructor() {
        this.categories_ = new Map();
    }

    // Creates a new minigame category. The category is guaranteed to be unique, but will only serve
    // as a completely opaque token to the implementing feature.
    createCategory(description) {
        const category = Symbol(description);

        this.categories_.set(category, description);
        return category;
    }

    // Deletes the minigame |category|. All minigames associated with it will be forcefully stopped,
    // and all players part of these minigames will be respawned.
    deleteCategory(category) {
        if (!this.categories_.has(category))
            throw new Error('Invalid category passed: ' + category);

        // TODO(Russell): Cancel any minigames running as part of this category.

        this.categories_.delete(category);
    }

    dispose() {
        
    }
}

exports = MinigameManager;
