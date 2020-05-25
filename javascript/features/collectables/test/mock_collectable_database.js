// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CollectableDatabase } from 'features/collectables/collectable_database.js';

// Mocked out version of the collectable database that will never hit an actual MySQL server, which
// is not desirable during testing. 
export class MockCollectableDatabase extends CollectableDatabase {
    async _loadCollectablesForPlayerQuery(player) {
        return {
            rows: [
                { collectable_type: 0, collectable_id: 1, collectable_round: 2 },
                { collectable_type: 0, collectable_id: 5, collectable_round: 2 },
                { collectable_type: 0, collectable_id: 1, collectable_round: 1 },
                { collectable_type: 0, collectable_id: 2, collectable_round: 1 },
                { collectable_type: 0, collectable_id: 3, collectable_round: 1 },
                { collectable_type: 0, collectable_id: 4, collectable_round: 1 },
                { collectable_type: 0, collectable_id: 5, collectable_round: 1 },
                { collectable_type: 1, collectable_id: 1, collectable_round: 1 },
                { collectable_type: 1, collectable_id: 2, collectable_round: 1 },
                { collectable_type: 1, collectable_id: 3, collectable_round: 1 },
                { collectable_type: 1, collectable_id: 4, collectable_round: 1 },
                { collectable_type: 1, collectable_id: 5, collectable_round: 1 },
                { collectable_type: 1, collectable_id: 6, collectable_round: 1 }
            ],

            affectedRows: 0,
            insertId: 0,
        }
    }

    async markCollectableForPlayer(player, type, round, collectableId) {}
}
