// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const MinigameManager = require('features/minigames/minigame_manager.js');
const MockMinigame = require('features/minigames/test/mock_minigame.js');

describe('MinigameManager', (it, beforeEach, afterEach) => {
    let gunther, russell;
    let manager = null;

    beforeEach(() => {
        gunther = server.playerManager.getById(0 /* Gunther */);
        russell = server.playerManager.getById(1 /* Russell */);

        manager = new MinigameManager();
    });

    afterEach(() => manager.dispose());

    it('should never return a previously handed out category', assert => {
        assert.notEqual(manager.createCategory('races'),
                        manager.createCategory('races'));
    });

    it('should allow for creating and deleting minigame categories', assert => {
        assert.throws(() => manager.deleteCategory(42));

        const races = manager.createCategory('races');
        manager.deleteCategory(races);

        assert.throws(() => manager.deleteCategory(races));
    });

    it('should throw errors in case of invalid parameters when creating a minigame', assert => {
        const category = manager.createCategory('races');
        const minigame = new MockMinigame();

        manager.createMinigame(category, minigame, russell);

        // Invalid category.
        assert.throws(() => manager.createMinigame(null, minigame, gunther));
        assert.throws(() => manager.createMinigame(Symbol(), minigame, gunther));
        assert.throws(() => manager.createMinigame(42, minigame, gunther));

        // Invalid minigame.
        assert.throws(() => manager.createMinigame(category, null, gunther));
        assert.throws(() => manager.createMinigame(category, {}, gunther));
        assert.throws(() => manager.createMinigame(category, 42, gunther));

        // Engaged player.
        assert.throws(() => manager.createMinigame(category, minigame, russell));
    });

    it('should expose an array of minigames for the given category', assert => {
        const category = manager.createCategory('races');

        const simpleRace = new MockMinigame({ name: 'My Simple Race' });
        const normalRace = new MockMinigame({ name: 'My Normal Race' });
        
        manager.createMinigame(category, simpleRace, gunther);
        manager.createMinigame(category, normalRace, russell);

        const minigames = manager.getMinigamesForCategory(category);

        assert.equal(minigames.length, 2);
        assert.isTrue(minigames.includes(simpleRace));
        assert.isTrue(minigames.includes(normalRace));
    });

    it('should properly update player state when creating a minigame', assert => {
        const category = manager.createCategory('test');
        const minigame = new MockMinigame();

        assert.isFalse(manager.isPlayerEngaged(gunther));
        assert.isNull(manager.getMinigameNameForPlayer(gunther));

        manager.createMinigame(category, minigame, gunther);

        assert.isTrue(manager.isPlayerEngaged(gunther));
        assert.equal(manager.getMinigameNameForPlayer(gunther), minigame.name);
    });

    it('should not allow players to engage in multiple minigames at once', assert => {
        const category = manager.createCategory('test');
        const minigame = new MockMinigame();

        assert.isFalse(manager.isPlayerEngaged(gunther));

        manager.createMinigame(category, minigame, gunther);

        assert.isTrue(manager.isPlayerEngaged(gunther));

        assert.throws(() => manager.createMinigame(category, minigame, gunther));
        // TODO(Russell): Test |gunther| signing up for another minigame.
    });
});
