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

    async _getGangsLeaderboardQuery({ days, limit }) {
        return [
            {
                gang_id: 9000,
                gang_name: 'Cheap People',
                color: 1325334698,
                member_count: 16,
                death_count: 1406,
                kill_count: 1636,
                damage_given: 453485.1510,
                damage_taken: 426507.2329,
                shots_hit: 46267,
                shots_missed: 82186,
            },
            {
                gang_id: 9001,
                gang_name: 'Anonymous Game',
                color: -1991054422,
                member_count: 5,
                death_count: 1375,
                kill_count: 1447,
                damage_given: 396929.6855,
                damage_taken: 384587.6379,
                shots_hit: 34265,
                shots_missed: 45930,
            },
            {
                gang_id: 9002,
                gang_name: 'Camin Bulevar',
                color: 265943722,
                member_count: 8,
                death_count: 2073,
                kill_count: 1431,
                damage_given: 422628.0353,
                damage_taken: 523225.8597,
                shots_hit: 41106,
                shots_missed: 82207,
            },
            {
                gang_id: 9003,
                gang_name: 'The Outlaws',
                color: -1040716630,
                member_count: 5,
                death_count: 707,
                kill_count: 1161,
                damage_given: 296363.3175,
                damage_taken: 228101.2331,
                shots_hit: 28035,
                shots_missed: 35871,
            },
        ];
    }

    async _getKillsLeaderboardQuery({ days, limit }) {
        return [
            {
                user_id: 122,
                username: '[BB]Ricky92',
                color: -7597057,
                death_count: 561,
                kill_count: 891,
                duration: 180249,
                shots: 49746,
            },
            {
                user_id: 123,
                username: '[inC]Reni[CP]',
                color: 612113322,
                death_count: 409,
                kill_count: 526,
                duration: 217618,
                shots: 42421,
            },
            {
                user_id: 124,
                username: '[AG]Newski',
                color: -1991054422,
                death_count: 188,
                kill_count: 380,
                duration: 49118,
                shots: 12912,
            },
            {
                user_id: 125,
                username: 'Sophia_Naz',
                color: 2070474410,
                death_count: 264,
                kill_count: 240,
                duration: 134391,
                shots: 25705,
            },
        ];
    }

    async _getReactionTestLeaderboardQuery({ days, limit }) {
        return [
            {
                user_id: 100278,
                username: 'Ds]_CH1R4Q_[TM',
                color: 944491178,
                reaction_tests_total: 10736,
                reaction_tests: 186,
                duration: 180249,
            },
            {
                user_id: 116903,
                username: 'Sand',
                color: 2049376255,
                reaction_tests_total: 1411,
                reaction_tests: 139,
                duration: 217618,
            },
            {
                user_id: 118048,
                username: '[nDz]S0n1c',
                color: 7538431,
                reaction_tests_total: 3676,
                reaction_tests: 106,
                duration: 49118,
            },
            {
                user_id: 103969,
                username: 'Sinned',
                color: 0,
                reaction_tests_total: 10228,
                reaction_tests: 51,
                duration: 134391,
            },
        ]
    }
}
