// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Minigame = require('features/minigames/minigame.js');
const MinigameManager = require('features/minigames/minigame_manager.js');
const MinigameObserver = require('features/minigames/minigame_observer.js');
const MockAnnounce = require('features/announce/test/mock_announce.js');
const MockDeathFeed = require('features/death_feed/test/mock_death_feed.js');
const MockMinigame = require('features/minigames/test/mock_minigame.js');
const Vector = require('base/vector.js');

describe('MinigameManager', (it, beforeEach, afterEach) => {
    let gunther, russell;
    let deathFeed = null;
    let manager = null;

    beforeEach(() => {
        gunther = server.playerManager.getById(0 /* Gunther */);
        russell = server.playerManager.getById(1 /* Russell */);

        deathFeed = new MockDeathFeed();

        manager = new MinigameManager(new MockAnnounce(), deathFeed);
    });

    afterEach(() => manager.dispose());

    it('should never return a previously handed out category', assert => {
        assert.notEqual(manager.createCategory('races'),
                        manager.createCategory('races'));
    });

    it('should allow for creating and deleting minigame categories', assert => {
        assert.throws(() => manager.deleteCategory(42));

        const races = manager.createCategory('races');
        return manager.deleteCategory(races).then(() => {
            assert.throws(() => manager.deleteCategory(races));
        });
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

    it('should enable observers to be passed for minigame categories', assert => {
        class MyCategoryObserver extends MinigameObserver {
            constructor() {
                super();

                this.started = [];
                this.finished = [];
            }

            onMinigameCreated(minigame) { this.started.push(minigame); }
            onMinigameFinished(minigame) { this.finished.push(minigame); }
        }

        const observer = new MyCategoryObserver();
        const category = manager.createCategory('test', observer);
        const minigame = new MockMinigame();

        assert.equal(observer.started.length, 0);
        assert.equal(observer.finished.length, 0);

        manager.createMinigame(category, minigame, gunther);
        assert.isTrue(manager.isPlayerEngaged(gunther));

        assert.equal(observer.started.length, 1);
        assert.equal(observer.finished.length, 0);

        gunther.disconnect();

        return minigame.finishPromise.then(() => {
            assert.isFalse(manager.isPlayerEngaged(gunther));
            assert.equal(observer.started.length, 1);
            assert.equal(observer.finished.length, 1);
        });
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

        return minigame.finishPromise.then(() => {
            assert.isFalse(manager.isPlayerEngaged(gunther));
            assert.equal(manager.getMinigamesForCategory(category).length, 0);
        });
    });

    it('should stop the minigame when the last engaged player disconnects', assert => {
        const category = manager.createCategory('test');
        const minigame = new MockMinigame();

        manager.createMinigame(category, minigame, gunther);
        assert.equal(gunther.messages.length, 1);
        assert.equal(russell.messages.length, 1);

        manager.addPlayerToMinigame(category, minigame, russell);
        assert.equal(gunther.messages.length, 1);
        assert.equal(russell.messages.length, 1);

        assert.equal(minigame.addedPlayers.length, 2);

        assert.isTrue(manager.isPlayerEngaged(gunther));
        assert.isTrue(manager.isPlayerEngaged(russell));
        assert.equal(manager.getMinigamesForCategory(category).length, 1);
        assert.equal(minigame.removedPlayers.length, 0);
        assert.equal(minigame.state, Minigame.STATE_SIGN_UP);

        gunther.disconnect();

        assert.isFalse(manager.isPlayerEngaged(gunther));
        assert.isTrue(manager.isPlayerEngaged(russell));
        assert.equal(manager.getMinigamesForCategory(category).length, 1);
        assert.equal(minigame.removedPlayers.length, 1);

        russell.disconnect();

        return minigame.finishPromise.then(reason => {
            assert.isFalse(manager.isPlayerEngaged(gunther));
            assert.isFalse(manager.isPlayerEngaged(russell));
            assert.equal(manager.getMinigamesForCategory(category).length, 0);
            assert.equal(minigame.removedPlayers.length, 2);

            assert.equal(reason, Minigame.REASON_NOT_ENOUGH_PLAYERS);
            assert.equal(minigame.state, Minigame.STATE_FINISHED);
        });
    });

    it('should be able for a minigame to require at least two players', assert => {
        const category = manager.createCategory('test');
        const minigame = new MockMinigame({ minimumParticipants: 2 });

        manager.createMinigame(category, minigame, gunther);
        manager.addPlayerToMinigame(category, minigame, russell);

        assert.isTrue(manager.isPlayerEngaged(gunther));
        assert.isTrue(manager.isPlayerEngaged(russell));
        assert.equal(manager.getMinigamesForCategory(category).length, 1);

        gunther.disconnect();

        return minigame.finishPromise.then(reason => {
            assert.isFalse(manager.isPlayerEngaged(gunther));
            assert.isFalse(manager.isPlayerEngaged(russell));
            assert.equal(manager.getMinigamesForCategory(category).length, 0);

            assert.equal(reason, Minigame.REASON_NOT_ENOUGH_PLAYERS);
        });
    });

    it('should cancel minigames when deleting a minigame category', assert => {
        const category = manager.createCategory('test');
        const minigame = new MockMinigame();

        manager.createMinigame(category, minigame, gunther);

        assert.isTrue(manager.isPlayerEngaged(gunther));
        assert.equal(manager.getMinigamesForCategory(category).length, 1);
        assert.equal(minigame.addedPlayers.length, 1);

        return manager.deleteCategory(category).then(() => {
            return minigame.finishPromise;

        }).then(reason => {
            assert.isFalse(manager.isPlayerEngaged(gunther));
            assert.equal(minigame.removedPlayers.length, 1);
            assert.equal(reason, Minigame.REASON_FORCED_STOP);

            return Promise.resolve().then(() =>
                assert.throws(() => manager.getMinigamesForCategory(category)));
        });
    });

    it('should remove a player from a minigame when they die', assert => {
        const category = manager.createCategory('test');
        const minigame = new MockMinigame();

        manager.createMinigame(category, minigame, gunther);

        assert.isTrue(manager.isPlayerEngaged(gunther));
        assert.equal(manager.getMinigamesForCategory(category).length, 1);
        assert.equal(minigame.addedPlayers.length, 1);

        // This test does not care about the minigame's state management.
        minigame.driver_.state = Minigame.STATE_RUNNING;

        gunther.die();
        assert.isFalse(gunther.spawn());

        return minigame.finishPromise.then(reason => {
            assert.isFalse(manager.isPlayerEngaged(gunther));
            assert.equal(manager.getMinigamesForCategory(category).length, 0);
            assert.equal(minigame.deathPlayers.length, 1);
            assert.equal(minigame.spawnPlayers.length, 0);
            assert.equal(minigame.removedPlayers.length, 1);
            assert.equal(reason, Minigame.REASON_NOT_ENOUGH_PLAYERS);
        });
    });

    it('should enable minigames to enable in-game respawns', assert => {
        const category = manager.createCategory('test');
        const minigame = new MockMinigame({ enableRespawn: true });

        manager.createMinigame(category, minigame, gunther);

        assert.isTrue(manager.isPlayerEngaged(gunther));
        assert.equal(manager.getMinigamesForCategory(category).length, 1);
        assert.equal(minigame.addedPlayers.length, 1);

        // This test does not care about the minigame's state management.
        minigame.driver_.state = Minigame.STATE_RUNNING;

        gunther.die();
        assert.isTrue(gunther.spawn());

        assert.isTrue(manager.isPlayerEngaged(gunther));
        assert.equal(manager.getMinigamesForCategory(category).length, 1);
        assert.equal(minigame.deathPlayers.length, 1);
        assert.equal(minigame.spawnPlayers.length, 1);
        assert.equal(minigame.removedPlayers.length, 0);
    });

    it('should hide the death feed for players engaged in a minigame', assert => {
        const category = manager.createCategory('test');
        const minigame = new MockMinigame();

        assert.isFalse(deathFeed.isDisabledForPlayer(gunther));

        manager.createMinigame(category, minigame, gunther);
        const driver = minigame.driver_;

        assert.isTrue(manager.isPlayerEngaged(gunther));

        driver.load();

        return minigame.loadPromise.then(() => {
            assert.isTrue(deathFeed.isDisabledForPlayer(gunther));

            driver.finish(Minigame.REASON_FORCED_STOP);
            return Promise.resolve();  // finishing a minigame is asynchronous

        }).then(() =>
            assert.isFalse(deathFeed.isDisabledForPlayer(gunther)));
    });

    it('should tell minigames about its players leaving their vehicles', assert => {
        const category = manager.createCategory('test');
        const minigame = new MockMinigame({ enableRespawn: true });

        manager.createMinigame(category, minigame, gunther);
        assert.isTrue(manager.isPlayerEngaged(gunther));

        // This test does not care about the minigame's state management.
        minigame.driver_.state = Minigame.STATE_RUNNING;

        gunther.changeState({ newState: Player.STATE_DRIVER,
                              oldState: Player.STATE_ON_FOOT });

        assert.equal(minigame.enterVehicles.length, 1);
        assert.equal(minigame.leaveVehicles.length, 0);

        gunther.changeState({ newState: Player.STATE_ON_FOOT,
                              oldState: Player.STATE_DRIVER });

        assert.equal(minigame.enterVehicles.length, 1);
        assert.equal(minigame.leaveVehicles.length, 1);
    });

    it('should not tell minigames of unrelated vehicle spawn and deaths', assert => {
        const category = manager.createCategory('test');
        const minigame = new MockMinigame({ enableRespawn: true });

        manager.createMinigame(category, minigame, gunther);
        assert.isTrue(manager.isPlayerEngaged(gunther));

        // This test does not care about the minigame's state management.
        minigame.driver_.state = Minigame.STATE_RUNNING;

        const infernus =
            server.vehicleManager.createVehicle({ modelId: 411, position: new Vector(0, 0, 0) });
        assert.isNotNull(infernus);
        assert.isTrue(infernus.isConnected());

        assert.equal(minigame.spawnVehicles.length, 0);
        assert.equal(minigame.deathVehicles.length, 0);

        infernus.spawn();
        infernus.death();

        assert.equal(minigame.spawnVehicles.length, 0);
        assert.equal(minigame.deathVehicles.length, 0);
    });

    it('should tell minigames about spawns and deaths of owned vehicles', assert => {
        const category = manager.createCategory('test');
        const minigame = new MockMinigame({ enableRespawn: true });

        manager.createMinigame(category, minigame, gunther);
        assert.isTrue(manager.isPlayerEngaged(gunther));

        // This test does not care about the minigame's state management.
        minigame.driver_.state = Minigame.STATE_RUNNING;

        const infernus =
            minigame.entities.createVehicle({ modelId: 411, position: new Vector(0, 0, 0) });
        assert.isNotNull(infernus);
        assert.isTrue(infernus.isConnected());

        assert.equal(minigame.spawnVehicles.length, 0);
        assert.equal(minigame.deathVehicles.length, 0);

        infernus.spawn();

        assert.equal(minigame.spawnVehicles.length, 1);
        assert.equal(minigame.deathVehicles.length, 0);

        infernus.death();

        assert.equal(minigame.spawnVehicles.length, 1);
        assert.equal(minigame.deathVehicles.length, 1);
    });

    it('should assign a unique virtual world to each minigame', assert => {
        const category = manager.createCategory('test');

        const firstMinigame = new MockMinigame();
        assert.throws(() => firstMinigame.virtualWorld);
        manager.createMinigame(category, firstMinigame, gunther);
        assert.doesNotThrow(() => firstMinigame.virtualWorld);
        assert.isTrue(manager.isPlayerEngaged(gunther));

        const secondMinigame = new MockMinigame();
        assert.throws(() => secondMinigame.virtualWorld);
        manager.createMinigame(category, secondMinigame, russell);
        assert.doesNotThrow(() => secondMinigame.virtualWorld);
        assert.isTrue(manager.isPlayerEngaged(russell));

        assert.notEqual(firstMinigame.virtualWorld, secondMinigame.virtualWorld);
    });

    it('should share the appropriate states for the given events', assert => {
        const category = manager.createCategory('test');

        // Resolvers for each of the minigame states. Will be triggered manually by the test.
        let loadResolver, startResolver, finishResolver;

        const minigame = new MockMinigame();
        minigame.loadPromise = new Promise(resolve => loadResolver = resolve);
        minigame.startPromise = new Promise(resolve => startResolver = resolve);
        minigame.finishPromise = new Promise(resolve => finishResolver = resolve);

        // The `state` accesor should throw an exception because it's not attached yet.
        assert.throws(() => minigame.state);

        manager.createMinigame(category, minigame, gunther);
        assert.isTrue(manager.isPlayerEngaged(gunther));

        assert.equal(minigame.state, Minigame.STATE_SIGN_UP);

        // TODO(Russell): Enable more natural state transitions, for example through the sign-up
        // manager(?) or through some sort of helper methods.

        const driver = minigame.driver_;

        driver.load();

        assert.equal(minigame.state, Minigame.STATE_LOADING);
        loadResolver();

        return minigame.loadPromise.then(() => {
            return Promise.resolve();  // starting a minigame is asynchronous as well

        }).then(() => {
            assert.equal(minigame.state, Minigame.STATE_RUNNING);
            startResolver();

            return minigame.startPromise;

        }).then(() => {
            driver.finish(Minigame.REASON_FORCED_STOP);
            return Promise.resolve();  // finishing a minigame is asynchronous as well

        }).then(() => {
            assert.equal(minigame.state, Minigame.STATE_FINISHED);
            finishResolver();
        });
    });
});
