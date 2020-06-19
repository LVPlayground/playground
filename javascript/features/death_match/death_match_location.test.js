// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { DeathMatchLocation } from 'features/death_match/death_match_location.js';

describe('DeathMatchLocation', (it) => {
    it('should be able to load location data', assert => {
        let counter = 0;

        for (const _ of DeathMatchLocation.getAllLocationIds()) {
            ++counter;
        }

        assert.isAbove(counter, 0);
    });

    it('should be able to retrieve locations by Id', assert => {
        const location = DeathMatchLocation.getById(1);

        assert.isNotNull(location);
        assert.equal(location.name, 'LV RW FightClub (skin hit)');

        assert.throws(() => DeathMatchLocation.getById(null));
        assert.throws(() => DeathMatchLocation.getById(0));
        assert.throws(() => DeathMatchLocation.getById('Rocket Power!'));
    });

    it('should have somewhat sensible data', assert => {
        for (const location of DeathMatchLocation.getAll()) {
            assert.equal(typeof location.id, 'number');
            assert.equal(typeof location.name, 'string');

            assert.isAbove(location.name.length, 3);
            assert.isBelow(location.name.length, 32);

            assert.equal(typeof location.interiorId, 'number');

            assert.isAboveOrEqual(location.interiorId, 0);
            assert.isBelowOrEqual(location.interiorId, 18);

            let counter = 0;

            for (const spawn of location.spawnPositions) {
                assert.isTrue(spawn.position instanceof Vector);

                assert.isAboveOrEqual(spawn.position.x, -20000);
                assert.isBelowOrEqual(spawn.position.x, 20000);

                assert.isAboveOrEqual(spawn.position.y, -20000);
                assert.isBelowOrEqual(spawn.position.y, 20000);

                assert.isAboveOrEqual(spawn.position.z, -100);
                assert.isBelowOrEqual(spawn.position.z, 1500);

                assert.equal(typeof spawn.rotation, 'number');

                assert.isAboveOrEqual(spawn.rotation, 0);
                assert.isBelowOrEqual(spawn.rotation, 360);

                ++counter;
            }
        }
    });
});
