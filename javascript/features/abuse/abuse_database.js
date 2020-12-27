// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Query to store the evidence in the database.
const STORE_EVIDENCE_QUERY = `
    INSERT INTO
        evidence
        (evidence_rid, evidence_date, evidence_detector, evidence_certainty, evidence_data,
         user_id, nickname, ip_address, gpci_hash)
    VALUES
        (?, NOW(), ?, ?, ?, ?, ?, INET_ATON(?), ?)`;

// Enables database communication for the abuse function, particularly to have the ability to
// automatically submit evidence of a detection to the database.
export class AbuseDatabase {
    // Stores the given evidence in the database. Meta-information about the player will be added
    // automatically, but most of it should be included in the |evidence|.
    async storeEvidence(rid, player, detectorName, certainty, evidence) {
        return server.database.query(
            STORE_EVIDENCE_QUERY, rid, detectorName, certainty, JSON.stringify(evidence),
            player.account.userId, player.name, player.ip, player.serial);
    }
}
