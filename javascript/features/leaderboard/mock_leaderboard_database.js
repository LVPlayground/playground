// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { LeaderboardDatabase } from 'features/leaderboard/leaderboard_database.js';

// Implementation of the LeaderboardDatabase where methods interacting with the database have been
// mocked out. Only intended for use while running tests on the server.
export class MockLeaderboardDatabase extends LeaderboardDatabase {
    async _getAccuracyLeaderboardQuery({ days, limit }) {
        return [
            {
                user_id: 123,
                username: 'Ds]_ch1r4q_',
                color: 944491178,
                accuracy: 0.5781,
                shots_hit: 1681,
                shots_missed: 1227,
                shots_taken: 523,
                duration: 55594,
            },
            {
                user_id: 124,
                username: 'Jasmine',
                color: 265943722,
                accuracy: 0.5262,
                shots_hit: 15199,
                shots_missed: 13688,
                shots_taken: 8337,
                duration: 84174,
            },
            {
                user_id: 125,
                username: '[BA]AzKiller',
                color: 944491178,
                accuracy: 0.4775,
                shots_hit: 1038,
                shots_missed: 1136,
                shots_taken: 888,
                duration: 12872,
            },
            {
                user_id: 126,
                username: 'TheMightyQ',
                color: -1040716630,
                accuracy: 0.3998,
                shots_hit: 10484,
                shots_missed: 15740,
                shots_taken: 9001,
                duration: 39046,
            },
        ];
    }

    async _getDamageLeaderboardQuery({ days, limit }) {
        return [
            {
                user_id: 123,
                username: '[BB]Ricky92',
                color: -7597057,
                damage_given: 149610.8407,
                damage_taken: 125739.2642,
                duration: 141786,
                shots: 33204,
            },
            {
                user_id: 124,
                username: 'TheMightyQ',
                color: -1040716630,
                damage_given: 111725.9262,
                damage_taken: 94154.0565,
                duration: 115933,
                shots: 26224,
            },
            {
                user_id: 125,
                username: '[CP]Humza',
                color: 1705896874,
                damage_given: 36733.4700,
                damage_taken: 48504.6063,
                duration: 85917,
                shots: 11182,
            },
            {
                user_id: 126,
                username: 'ioutHO',
                color: -1040716630,
                damage_given: 29535.9911,
                damage_taken: 28392.9552,
                duration: 17063,
                shots: 7115,
            },
        ];
    }
}
