// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ResidentialValueMap = require('features/economy/residential_value_map.js');
const Vector = require('base/vector.js');

describe('ResidentialValueMap', it => {
    it('should be able to load and query the data', assert => {
        const map = new ResidentialValueMap();

        // The tip of the pirate ship.
        assert.equal(map.query(new Vector(2000, 1567, 15)), 5);

        // The army base in San Fierro.
        assert.equal(map.query(new Vector(-1450, 400, 10)), 4);

        // City center in San Fierro.
        assert.equal(map.query(new Vector(-2316, 420, 10)), 3);

        // Regular city in San Fierro.
        assert.equal(map.query(new Vector(-2320, 420, 10)), 2);

        // Docks in Montgomery
        assert.equal(map.query(new Vector(-400, 1175, 10)), 1);

        // Immediately next to the polygon of San Fierro Airport.
        assert.equal(map.query(new Vector(-1150, 100, 10)), 0);
    });
});
