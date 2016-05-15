// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Minigame = require('features/minigames/minigame.js');
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

        const simpleRace = new MockMinigame({ name: 'My Simple Race' });
        const normalRace = new MockMinigame({ name: 'My Normal Race' });

        assert.isFalse(manager.isPlayerEngaged(gunther));

        manager.createMinigame(category, simpleRace, gunther);
        manager.createMinigame(category, normalRace, russell);

        assert.isTrue(manager.isPlayerEngaged(gunther));
        assert.isTrue(manager.isPlayerEngaged(russell));

        assert.throws(() => manager.createMinigame(category, simpleRace, gunther));
        assert.throws(() => manager.addPlayerToMinigame(category, normalRace, gunther));
    });

    it('should stop the minigame when the only engaged player disconnects', assert => {
        const category = manager.createCategory('test');
        const minigame = new MockMinigame();

        manager.createMinigame(category, minigame, gunther);
        assert.isTrue(manager.isPlayerEngaged(gunther));

        gunther.disconnect();

        assert.isFalse(manager.isPlayerEngaged(gunther));
        assert.equal(manager.getMinigamesForCategory(category).length, 0);
    });

    it('should stop the minigame when the last engaged player disconnects', assert => {
        const category = manager.createCategory('test');
        const minigame = new MockMinigame();

        manager.createMinigame(category, minigame, gunther);
        manager.addPlayerToMinigame(category, minigame, russell);

        assert.equal(minigame.addedPlayers.length, 2);

        assert.isTrue(manager.isPlayerEngaged(gunther));
        assert.isTrue(manager.isPlayerEngaged(russell));
        assert.equal(manager.getMinigamesForCategory(category).length, 1);
        assert.equal(minigame.removedPlayers.length, 0);
        assert.isNull(minigame.finishedReason);
        assert.equal(minigame.state, Minigame.STATE_SIGN_UP);

        gunther.disconnect();

        assert.isFalse(manager.isPlayerEngaged(gunther));
        assert.isTrue(manager.isPlayerEngaged(russell));
        assert.equal(manager.getMinigamesForCategory(category).length, 1);
        assert.equal(minigame.removedPlayers.length, 1);
        assert.isNull(minigame.finishedReason);

        russell.disconnect();

        assert.isFalse(manager.isPlayerEngaged(gunther));
        assert.isFalse(manager.isPlayerEngaged(russell));
        assert.equal(manager.getMinigamesForCategory(category).length, 0);
        assert.equal(minigame.removedPlayers.length, 2);
        assert.equal(minigame.finishedReason, Minigame.REASON_NOT_ENOUGH_PLAYERS);
        assert.equal(minigame.state, Minigame.STATE_FINISHED);
    });

    it('should be able for a minigame to require at least two players', assert => {
        const category = manager.createCategory('test');
        const minigame = new MockMinigame({ minimumParticipants: 2 });

        manager.createMinigame(category, minigame, gunther);
        manager.addPlayerToMinigame(category, minigame, russell);

        assert.isTrue(manager.isPlayerEngaged(gunther));
        assert.isTrue(manager.isPlayerEngaged(russell));
        assert.equal(manager.getMinigamesForCategory(category).length, 1);
        assert.isNull(minigame.finishedReason);

        gunther.disconnect();

        assert.isFalse(manager.isPlayerEngaged(gunther));
        assert.isFalse(manager.isPlayerEngaged(russell));
        assert.equal(manager.getMinigamesForCategory(category).length, 0);
        assert.equal(minigame.finishedReason, Minigame.REASON_NOT_ENOUGH_PLAYERS);
    });

    it('should cancel minigames when deleting a minigame category', assert => {
        const category = manager.createCategory('test');
        const minigame = new MockMinigame();

        manager.createMinigame(category, minigame, gunther);

        assert.isTrue(manager.isPlayerEngaged(gunther));
        assert.equal(manager.getMinigamesForCategory(category).length, 1);
        assert.equal(minigame.addedPlayers.length, 1);

        manager.deleteCategory(category);

        assert.isFalse(manager.isPlayerEngaged(gunther));
        assert.throws(() => manager.getMinigamesForCategory(category));

        assert.equal(minigame.removedPlayers.length, 1);
        assert.equal(minigame.finishedReason, Minigame.REASON_FORCED_STOP);
    });

    it('should remove a player from a minigame when they die', assert => {
        const category = manager.createCategory('test');
        const minigame = new MockMinigame();

        manager.createMinigame(category, minigame, gunther);

        assert.isTrue(manager.isPlayerEngaged(gunther));
        assert.equal(manager.getMinigamesForCategory(category).length, 1);
        assert.equal(minigame.addedPlayers.length, 1);

        gunther.die();
        assert.isFalse(gunther.spawn());

        assert.isFalse(manager.isPlayerEngaged(gunther));
        assert.equal(manager.getMinigamesForCategory(category).length, 0);
        assert.equal(minigame.deathPlayers.length, 1);
        assert.equal(minigame.spawnPlayers.length, 0);
        assert.equal(minigame.removedPlayers.length, 1);
    });

    it('should enable minigames to enable in-game respawns', assert => {
        const category = manager.createCategory('test');
        const minigame = new MockMinigame({ enableRespawn: true });

        manager.createMinigame(category, minigame, gunther);

        assert.isTrue(manager.isPlayerEngaged(gunther));
        assert.equal(manager.getMinigamesForCategory(category).length, 1);
        assert.equal(minigame.addedPlayers.length, 1);

        gunther.die();
        assert.isTrue(gunther.spawn());

        assert.isTrue(manager.isPlayerEngaged(gunther));
        assert.equal(manager.getMinigamesForCategory(category).length, 1);
        assert.equal(minigame.deathPlayers.length, 1);
        assert.equal(minigame.spawnPlayers.length, 1);
        assert.equal(minigame.removedPlayers.length, 0);
    });

    it('should tell minigames about its players leaving their vehicles', assert => {
        const category = manager.createCategory('test');
        const minigame = new MockMinigame({ enableRespawn: true });

        manager.createMinigame(category, minigame, gunther);
        assert.isTrue(manager.isPlayerEngaged(gunther));

        gunther.changeState({ newState: Player.STATE_DRIVER,
                              oldState: Player.STATE_ON_FOOT });

        assert.equal(minigame.enterVehicles.length, 1);
        assert.equal(minigame.leaveVehicles.length, 0);

        gunther.changeState({ newState: Player.STATE_ON_FOOT,
                              oldState: Player.STATE_DRIVER });

        assert.equal(minigame.enterVehicles.length, 1);
        assert.equal(minigame.leaveVehicles.length, 1);
    });

});
