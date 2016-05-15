// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const MinigameManager = require('features/minigames/minigame_manager.js');

describe('MinigameManager', (it, beforeEach, afterEach) => {
    let gunther, russell;
    let manager = null;

    beforeEach(() => {
        gunther = server.playerManager.getById(0 /* Gunther */);
        russell = server.playerManager.getById(1 /* Russell */);

        manager = new MinigameManager();
    });

    afterEach(() => manager.dispose());

    it('should never return the same category', assert => {
        assert.notEqual(manager.createCategory('races'),
                        manager.createCategory('races'));
    });

    it('should allow for creating and deleting minigame categories', assert => {
        assert.throws(() => manager.deleteCategory(42));

        const races = manager.createCategory('races');
        manager.deleteCategory(races);

        assert.throws(() => manager.deleteCategory(races));
    });
});
