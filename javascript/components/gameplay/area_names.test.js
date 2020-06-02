// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Vector } from 'base/vector.js';

import { getAreaNameForPosition } from 'components/gameplay/area_names.js';

describe('AreaNames', it => {
    it('should be able to determine area names', assert => {
        const cases = [
            { position: [ 229, -98, 0 ], name: 'Red County' },
            { position: [ 637, -536, 15 ], name: 'Dillimore' },
            { position: [ 797, -1248, 13 ], name: 'Vinewood' },
            { position: [ -803, 1541, 25 ], name: 'Las Barrancas' },
            { position: [ -1986, -861, 31 ], name: 'Foster Valley' },
            { position: [ 1420, 1336, 10 ], name: 'Las Venturas Airport' },
            { position: [ 4000, -4000, 10 ], name: 'San Andreas' },
        ];

        for (const { position, name } of cases) {
            assert.setContext(name);
            assert.equal(getAreaNameForPosition(new Vector(...position)), name);
        }
    });
});
