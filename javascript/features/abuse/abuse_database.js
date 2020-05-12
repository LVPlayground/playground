// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { ip2long } from 'features/nuwani_commands/ip_utilities.js';

// Query to store the evidence in the database.
const STORE_EVIDENCE_QUERY = `
    INSERT INTO
        evidence
        (evidence_date, evidence_detector, evidence_certainty, evidence_data,
         user_id, nickname, position_x, position_y, position_z, interior_id, virtual_world_id,
         ip_address, gpci_hash)
    VALUES
        (NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

// Enables database communication for the abuse function, particularly to have the ability to
// automatically submit evidence of a detection to the database.
export class AbuseDatabase {
    // Stores the given evidence in the database.
    async storeEvidence({ player, detectorName, certainty, evidence }) {
        const position = player.position;

        return server.database.query(
            STORE_EVIDENCE_QUERY, detectorName, certainty, JSON.stringify(evidence),
            player.account.userId, player.name, position.x, position.y, position.z,
            player.interiorId, player.virtualWorld, ip2long(player.ip), player.serial);
    }
}
