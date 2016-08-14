// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

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
            'Tiny Apartment',
            'Small Apartment',
            'Normal House (1)',
            'Normal House (2)',
            'Large House',
            'Mansion'
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
});
