// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { RaceDatabase } from 'features/races/race_database.js';

// Mocked out implementation of the RaceDatabase, which can be used while running tests.
export class MockRaceDatabase extends RaceDatabase {
    async getHighscoresQuery() {
        return [
            {
                race_id: 1 /* Coastal Conduit */,
                result_time: 123000,
                username: 'Badeend',
                color: 0,
            },
            {
                race_id: 2 /* Los Santos Blown Bikes */,
                result_time: 234000,
                username: 'Lithirm',
                color: -15428694,
            }
        ];
    }

    async getHighscoresForPlayerQuery(player) {
        return [
            {
                race_id: 1 /* Coastal Conduit */,
                result_time: 128000,
            }
        ];
    }

    async readResultsQuery(player, description) {
        if (player.name === 'Gunther') {
            // Old-style results, where the final checkpoint time is not recorded.
            return [
                { checkpoint_index: 0, checkpoint_time: 10, final_checkpoint_time: 60 },
                { checkpoint_index: 1, checkpoint_time: 20, final_checkpoint_time: 60 },
                { checkpoint_index: 2, checkpoint_time: 30, final_checkpoint_time: 60 },
                { checkpoint_index: 3, checkpoint_time: 40, final_checkpoint_time: 60 },
                { checkpoint_index: 4, checkpoint_time: 50, final_checkpoint_time: 60 },
            ];
        } else if (player.name === 'Russell') {
            // New-style results, where the final checkpoint time *is* recorded.
            return [

                { checkpoint_index: 0, checkpoint_time: 10, final_checkpoint_time: 60 },
                { checkpoint_index: 1, checkpoint_time: 20, final_checkpoint_time: 60 },
                { checkpoint_index: 2, checkpoint_time: 30, final_checkpoint_time: 60 },
                { checkpoint_index: 3, checkpoint_time: 40, final_checkpoint_time: 60 },
                { checkpoint_index: 4, checkpoint_time: 50, final_checkpoint_time: 60 },
                { checkpoint_index: 5, checkpoint_time: 60, final_checkpoint_time: 60 },  // <----
            ];
        } else {
            return [];
        }
    }

    async storeResults(player, description, position, results) {}
}
