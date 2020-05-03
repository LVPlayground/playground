// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { ZoneDatabase } from 'features/gang_zones/zone_database.js';

const kGangBA = 1086;
const kGangNB = 871;

// Mock implementation of the gang zone database class. Mimics identical behaviour, just fakes the
// actual database operations with mocked data.
export class MockZoneDatabase extends ZoneDatabase {
    // Public version of the individual gang constants.
    static BA = kGangBA;
    static NB = kGangNB;

    // Populates a series of test houses to |houses| that are significant for the testability of
    // this feature. There could be other houses too, but we'll ignore those.
    async populateTestHouses(houses) {
        const houseManager = houses.manager_;
        const housesForTesting = [
            {
                gangId: kGangBA,
                userId: 9001,  // [BA]AzKiller
                location: [ 1500.0, 1500.0, 20.0 ],
            }
        ];

        const gunther = server.playerManager.getById(/* Gunther= */ 0);
        for (const houseForTesting of housesForTesting) {
            gunther.identify({ userId: houseForTesting.userId });
            gunther.gangId = houseForTesting.gangId;

            const location = await houseManager.createLocation(gunther, {
                facingAngle: 0,
                interiorId: 0,
                position: new Vector(...houseForTesting.location),
            });

            await houseManager.createHouse(gunther, location, /* interiorId= */ 0);
        }
    }

    // Overridden.
    async _getActiveMembersQuery({ gangId }) {
        if (gangId === kGangNB) {
            return {
                rows: [
                    { gang_id: kGangNB, user_id: 3001 },  // [NB]D.R.E
                    { gang_id: kGangNB, user_id: 3002 },  // [NB]90NINE
                    { gang_id: kGangNB, user_id: 3003 },  // [NB]Dr.Vibrator
                    { gang_id: kGangNB, user_id: 3004 },  // [NB]ExPloiTeD
                    { gang_id: kGangNB, user_id: 3005 },  // [NB]Eminich
                ]
            };
        }

        return {
            rows: [
                { gang_id: kGangBA, user_id: 9001 },  // [BA]AzKiller
                { gang_id: kGangBA, user_id: 9002 },  // Agent[BA]
                { gang_id: kGangBA, user_id: 9003 },  // [BA]Sammo
                { gang_id: kGangBA, user_id: 9004 },  // [BA]Deer_Hunter
                { gang_id: kGangBA, user_id: 9005 },  // [BA]Curry
                { gang_id: kGangBA, user_id: 9006 },  // [BA]Slick
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
