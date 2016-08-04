// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Minigames = require('features/minigames/minigames.js');
const MockAnnounce = require('features/announce/test/mock_announce.js');
const MockDeathFeed = require('features/death_feed/test/mock_death_feed.js');
const MockRaceDatabase = require('features/races/test/mock_race_database.js');
const Race = require('features/races/race.js');
const RaceManager = require('features/races/race_manager.js');

describe('RaceManager', (it, beforeEach, afterEach) => {
    let gunther = null;
    let manager = null;

    beforeEach(() => {
        gunther = server.playerManager.getById(0 /* Gunther */);

        // Load the mocked announce, but the real minigames feature, which races depend on.
        server.featureManager.load({
            announce: MockAnnounce,
            deathFeed: MockDeathFeed,
            minigames: Minigames
        });

        manager = new RaceManager(
            null /* database */, server.featureManager.getFeatureForTests('minigames'));
        manager.database_ = new MockRaceDatabase();
    });

    afterEach(() => {
        if (manager)
            manager.dispose();
    });

    it('should not allow registration of duplicated race Ids', assert => {
        const race = new Race({ id: 42 });

        assert.doesNotThrow(() => manager.registerRace(race));
        assert.throws(() => manager.registerRace(race));

        assert.isTrue(manager.isValid(race.id));
    });

    it('should be able to load and associate all-time high scores with races', assert => {
        const race = new Race({ id: 42 });

        manager.registerRace(race)

        assert.isTrue(manager.isValid(race.id));
        assert.isNull(race.bestRace);

        return manager.loadRecordTimes().then(() => {
            assert.isNotNull(race.bestRace);
            assert.equal(race.bestRace.name, 'Russell');
            assert.equal(race.bestRace.time, 83 /* 1:23 */);
        });
    });

    it('should delete the minigame category when being disposed of', assert => {
        const category = manager.minigameCategory_;
        const minigames = manager.minigames_;

        assert.doesNotThrow(() => minigames.getMinigamesForCategory(category));

        manager.dispose();
        manager = null;

        // Category removal is an asynchronous process.
        Promise.resolve().then(() =>
            assert.throws(() => minigames.getMinigamesForCategory(category)));
    });

    it('should not include any personal record times for unregistered players', assert => {
        const race = new Race({ id: 42 });
        manager.registerRace(race);

        return manager.loadRecordTimesForPlayer(gunther).then(races => {
            assert.equal(races.length, 1);
            assert.equal(races[0].id, 42);

            assert.isNull(races[0].personalBestTime);
        });
    });

    it('should include personal record times for registered players', assert => {
        const race = new Race({ id: 42 });
        manager.registerRace(race);

        gunther.identify();

        return manager.loadRecordTimesForPlayer(gunther).then(races => {
            assert.equal(races.length, 1);
            assert.equal(races[0].id, 42);

            assert.isNotNull(races[0].personalBestTime);
            assert.equal(races[0].personalBestTime, 83 /* 1:23 */);
        });
    });

    it('should be able to include all-time high scores when getting personal scores', assert => {
        const race = new Race({ id: 42 });

        manager.registerRace(race);

        gunther.identify();

        return manager.loadRecordTimes().then(() => {
            return manager.loadRecordTimesForPlayer(gunther);

        }).then(races => {
            assert.equal(races.length, 1);
            assert.equal(races[0].id, 42);

            assert.isNotNull(races[0].bestRace);
            assert.isNotNull(races[0].personalBestTime);
        });
    });

    // ---------------------------------------------------------------------------------------------
    // TODO(Russell): Enable the rest of the tests.
    return;

    it('should not be able to start races with invalid Ids', assert => {
        const race = new Race({ id: 42 });

        assert.isFalse(manager.isValid(42));
        assert.throws(() => manager.startRace(gunther, 42 /* raceId */));

        manager.registerRace(race);

        assert.isTrue(manager.isValid(42));
        assert.doesNotThrow(() => manager.startRace(gunther, 42 /* raceId */));
    });
});
