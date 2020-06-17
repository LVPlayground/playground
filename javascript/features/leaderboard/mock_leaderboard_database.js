// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { LeaderboardDatabase } from 'features/leaderboard/leaderboard_database.js';

// Implementation of the LeaderboardDatabase where methods interacting with the database have been
// mocked out. Only intended for use while running tests on the server.
export class MockLeaderboardDatabase extends LeaderboardDatabase {
    async _getDamageLeaderboardQuery({ days, limit }) {
        return [
            {
                username: '[BB]Ricky92',
                color: -7597057,
                damage_given: 149610.8407,
                damage_taken: 125739.2642,
                duration: 141786,
                shots: 33204,
            },
            {
                username: 'TheMightyQ',
                color: -1040716630,
                damage_given: 111725.9262,
                damage_taken: 94154.0565,
                duration: 115933,
                shots: 26224,
            },
            {
                username: '[CP]Humza',
                color: 1705896874,
                damage_given: 36733.4700,
                damage_taken: 48504.6063,
                duration: 85917,
                shots: 11182,
            },
            {
                username: 'ioutHO',
                color: -1040716630,
                damage_given: 29535.9911,
                damage_taken: 28392.9552,
                duration: 17063,
                shots: 7115,
            }
        ];
    }
}
