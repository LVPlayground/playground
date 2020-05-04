// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { ip2long } from 'features/nuwani_commands/ip_utilities.js';
import { murmur3hash } from 'base/murmur3hash.js';

// Query to store the evidence in the database.
const STORE_EVIDENCE_QUERY = `
    INSERT INTO
        evidence
        (evidence_date, evidence_detector, evidence_certainty, evidence_data,
         user_id, nickname, ip_address, gpci_hash)
    VALUES
        (NOW(), ?, ?, ?)`;

// Enables database communication for the abuse function, particularly to have the ability to
// automatically submit evidence of a detection to the database.
export class AbuseDatabase {
    // Stores the given evidence in the database.
    async storeEvidence({ player, detectorName, certainty, evidence }) {
        return server.database.query(
            STORE_EVIDENCE_QUERY, detectorName, certainty, JSON.stringify(evidence), player.userId,
            player.nickname, ip2long(player.ip), murmur3hash(player.gpci));
    }
}
