// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { AbuseDatabase } from 'features/abuse/abuse_database.js';

// Mocked implementation of the AbuseDatabase class which avoids hitting the actual MySQL database,
// but still inspects the given data and ensures a properly formatted query would work well.
export class MockAbuseDatabase extends AbuseDatabase {
    // Overridden.
    async storeEvidence(rid, player, detectorName, certainty, evidence) {
        // Serialize the |evidence| to ensure that whatever's given is JSON-serializable.
        JSON.stringify(evidence);
    }
}
