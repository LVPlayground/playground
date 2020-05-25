// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Query to fetch all the finished collectables by a player from the database, with the highest
// round at which a collectable has been collected.
const LOAD_COLLECTABLE_QUERY = `
    SELECT
        collectable_type,
        collectable_id,
        MAX(collectable_round) AS collectable_round
    FROM
        collectables
    WHERE
        user_id = ?
    GROUP BY
        collectable_type, collectable_id
    ORDER BY
        collectable_round DESC`;
    
// Query to mark a particular collectable as having been found in the database.
const MARK_COLLECTABLE_QUERY = `
    INSERT INTO
        collectables
        (user_id, collectable_date, collectable_type, collectable_round, collectable_id)
    VALUES
        (?, NOW(), ?, ?, ?)`;

// Provides the collectable feature the ability to interact with the database. Two key operations
// are supported: (1) the ability to load collected collectables, and (2) the ability to mark ones.
export class CollectableDatabase {
    // Types of collectables that are known to the database.
    static kSprayTag = 0;
    static kRedBarrel = 1;

    // Loads the collectables for the given |player|. They are grouped by the kind of collectable,
    // and returned as a structure containing { collected<Set>, collectedRound<Set>, round }.
    async loadCollectablesForPlayer(player) {
        const results = await this._loadCollectablesForPlayerQuery(player);
        const collectables = new Map([
            [
                CollectableDatabase.kSprayTag,
                {
                    collected: new Set(),
                    collectedRound: new Set(),
                    round: null,
                }
            ],
            [
                CollectableDatabase.kRedBarrel,
                {
                    collected: new Set(),
                    collectedRound: new Set(),
                    round: null,
                }
            ]
        ]);

        if (results && results.rows.length > 0) {
            for (const row of results.rows) {
                if (!collectables.has(row.collectable_type))
                    continue;  // ignore data we do not recognise

                const data = collectables.get(row.collectable_type);
                if (!data.round)
                    data.round = row.collectable_round;
                
                if (data.round === row.collectable_round)
                    data.collectedRound.add(row.collectable_id);

                data.collected.add(row.collectable_id);
            }
        }

        return collectables;
    }

    async _loadCollectablesForPlayerQuery(player) {
        return server.database.query(LOAD_COLLECTABLE_QUERY, player.account.userId);
    }

    // Marks the given |collectableId| of the given |type| as found for the given |player|.
    async markCollectableForPlayer(player, type, round, collectableId) {
        await server.database.query(
            MARK_COLLECTABLE_QUERY, player.account.Id, type, round, collectableId);
    }
}
