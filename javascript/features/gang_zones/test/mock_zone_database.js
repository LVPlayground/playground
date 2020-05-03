// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { ZoneDatabase } from 'features/gang_zones/zone_database.js';

const kGangBA = 1086;

// Mock implementation of the gang zone database class. Mimics identical behaviour, just fakes the
// actual database operations with mocked data.
export class MockZoneDatabase extends ZoneDatabase {
    // Public version of the kGangBA constant.
    static BA = kGangBA;

    // Overridden.
    async _getActiveMembersQuery() {
        return {
            rows: [
                { gang_id: kGangBA, user_id: 1 },  // [BA]AzKiller
                { gang_id: kGangBA, user_id: 2 },  // Agent[BA]
                { gang_id: kGangBA, user_id: 3 },  // [BA]Sammo
                { gang_id: kGangBA, user_id: 4 },  // [BA]Deer_Hunter
                { gang_id: kGangBA, user_id: 5 },  // [BA]Curry
                { gang_id: kGangBA, user_id: 6 },  // [BA]Slick
            ]
        };
    }

    // Overridden.
    async _getActiveGangsQuery(activeGangIds) {
        const rows = [];
        const seen = new Set();

        for (const gangId of activeGangIds) {
            if (seen.has(gangId))
                throw new Error(`Gang Id ${gangId} has been supplied multiple times.`);

            switch (gangId) {
                case kGangBA:
                    rows.push({
                        gang_id: kGangBA,
                        gang_name: 'BA Hooligans',
                        gang_color: -15428694,
                    });
                    break;
            }

            seen.add(gangId);
        }

        return { rows };
    }
}
