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
        const clownHousesForTesting = [
            [ 2564.6738, 1580.9309, 10.8203 ],
            [ 2563.9091, 1571.9478, 10.8203 ],
            [ 2563.9909, 1551.9309, 10.8203 ],
            [ 2564.4260, 1541.9356, 10.8203 ],
            [ 2533.8684, 1507.8079, 11.5713 ],
            [ 2483.4956, 1526.7932, 11.2776 ],
            [ 2394.7351, 692.5378, 11.4531 ],
            [ 2397.9511, 732.6172, 11.4609 ],
            [ 2347.2226, 693.9076, 11.4609 ],
            [ 2348.5305, 734.4151, 11.4682 ],
            [ 2315.2888, 692.7879, 11.4609 ],
            [ 2260.3251, 734.7573, 11.4609 ],
            [ 911.4104, -1120.0834, 24.0340 ],
            [ 885.1795, -1088.2911, 24.2968 ],
            [ 849.2283, -1088.3745, 24.2968 ],
            [ 838.3325, -1112.0974, 24.1613 ],
            [ 813.7155, -1102.8255, 25.7877 ],
            [ 845.3483, -1080.4429, 24.2968 ],
        ];

        const housesForTesting = clownHousesForTesting.map((location, index) => {
            return {
                gangId: kGangBA,
                userId: 9001 + (index % 6),
                location
            };
        });

        const gunther = server.playerManager.getById(/* Gunther= */ 0);
        for (const houseForTesting of housesForTesting) {
            await gunther.identify({ userId: houseForTesting.userId });
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
                    { gang_id: kGangNB, user_id: 3001, is_vip: 0 },  // [NB]D.R.E
                    { gang_id: kGangNB, user_id: 3002, is_vip: 0 },  // [NB]90NINE
                    { gang_id: kGangNB, user_id: 3003, is_vip: 0 },  // [NB]Dr.Vibrator
                    { gang_id: kGangNB, user_id: 3004, is_vip: 0 },  // [NB]ExPloiTeD
                    { gang_id: kGangNB, user_id: 3005, is_vip: 0 },  // [NB]Eminich
                ]
            };
        }

        return {
            rows: [
                { gang_id: kGangBA, user_id: 9001, is_vip: 1 },  // [BA]AzKiller
                { gang_id: kGangBA, user_id: 9002, is_vip: 0 },  // Agent[BA]
                { gang_id: kGangBA, user_id: 9003, is_vip: 1 },  // [BA]Sammo
                { gang_id: kGangBA, user_id: 9004, is_vip: 1 },  // [BA]Deer_Hunter
                { gang_id: kGangBA, user_id: 9005, is_vip: 0 },  // [BA]Curry
                { gang_id: kGangBA, user_id: 9006, is_vip: 1 },  // [BA]Slick
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
                        gang_goal: 'Cl0wning around',
                        gang_color: -15428694,
                    });
                    break;
            }

            seen.add(gangId);
        }

        return { rows };
    }
}
