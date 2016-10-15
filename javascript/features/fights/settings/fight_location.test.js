// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const FightLocation = require('features/fights/settings/fight_location.js');

describe('FightLocation', it => {
    it('should be able to load location data', assert => {
        let counter = 0;

        for (const location of FightLocation.getAll())
            ++counter;

        assert.isAbove(counter, 0);

        let available = 0;

        for (const location of FightLocation.getAvailable())
            ++available;

        assert.isBelowOrEqual(available, counter);
    });

    it('should be able to retrieve locations by Id', assert => {
        const location = FightLocation.getById(1);

        assert.isNotNull(location);
        assert.equal(location.name, 'LV FightClub');

        assert.throws(() => FightLocation.getById(null));
        assert.throws(() => FightLocation.getById(-42));
        assert.throws(() => FightLocation.getById('cheese'));
    });

    it('should have somewhat sensible data', assert => {
        for (const location of FightLocation.getAll()) {
            assert.equal(typeof location.id, 'number');
            assert.equal(typeof location.name, 'string');

            assert.isAbove(location.name.length, 3);
            assert.isBelow(location.name.length, 32);

            assert.equal(typeof location.interiorId, 'number');

            assert.isAboveOrEqual(location.interiorId, 0);
            assert.isBelowOrEqual(location.interiorId, 18);

            assert.isAboveOrEqual(location.maxParties, 2);

            let counter = 0;

            for (const spawn of location.spawnPositions) {
                assert.isTrue(spawn.position instanceof Vector);

                assert.isAboveOrEqual(spawn.position.x, -20000);
                assert.isBelowOrEqual(spawn.position.x, 20000);

                assert.isAboveOrEqual(spawn.position.y, -20000);
                assert.isBelowOrEqual(spawn.position.y, 20000);

                assert.isAboveOrEqual(spawn.position.z, -20000);
                assert.isBelowOrEqual(spawn.position.z, 20000);

                assert.equal(typeof spawn.rotation, 'number');

                assert.isAboveOrEqual(spawn.rotation, 0);
                assert.isBelowOrEqual(spawn.rotation, 360);

                ++counter;
            }

            assert.equal(location.maxParties, counter);

            // TODO: Verify the type of |boundaries|.
        }
    });
});
