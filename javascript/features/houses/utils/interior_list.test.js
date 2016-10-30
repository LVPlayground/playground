// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Economy = require('features/economy/economy.js');
const InteriorList = require('features/houses/utils/interior_list.js');

describe('InteriorList', it => {
    it('basically should never change', assert => {
        // -----------------------------------------------------------------------------------------
        //
        // PLEASE READ:
        //   You may only update the following results when the name of an interior changes, or when
        //   you've added a new interior *at the end of the list*.
        //
        //   If you need to change the ordering or existing interiors, or if you are here to remove
        //   an interior, you are doing it wrong. The list of interiors cannot change, as it would
        //   break existing houses out there. Please talk to Russell if this is not clear.
        //

        const InteriorNames = [
            // Locations introduced in LVP 30.0
            'Hotel Room (1)',
            'Small Apartment',
            'Normal House (1)',
            'Normal House (2)',
            'Large House (1)',
            'Mansion',

            // Locations introduced in LVP 31.0
            'Love Nest',
            'Hotel Room (2)',
            'Large House (2)',
            'Large House (3)',
            'Normal House (3)',
            'Pleasure Dome',
            'Hotel Reception',
            'RC Playground'
        ];

        //
        // -----------------------------------------------------------------------------------------

        let actualNames = [];
        for (let interiorId = 0;; ++interiorId) {
            try {
                actualNames.push(InteriorList.getById(interiorId).name);
            } catch (e) {
                break;
            }
        }

        assert.deepEqual(InteriorNames, actualNames);
    });

    it('should maintain some sensible ordering for selectable interiors', assert => {
        const economy = new Economy();
        const position = new Vector(0, 0, 0);
        const parkingLotCount = 0;

        const InteriorNames = [
            'Hotel Room (1)',
            'Hotel Room (2)',
            'RC Playground',
            'Small Apartment',
            'Normal House (1)',
            'Normal House (2)',
            'Normal House (3)',
            'Large House (1)',
            'Large House (2)',
            'Large House (3)',
            'Hotel Reception',
            'Love Nest',
            'Mansion',
            'Pleasure Dome'
        ];

        let actualNames = [];
        for (const interior of InteriorList.forEconomy(economy, { position, parkingLotCount }))
            actualNames.push(interior.name);

        assert.deepEqual(InteriorNames, actualNames);
    });
});
