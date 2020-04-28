// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { BanDatabase } from 'features/punishments/ban_database.js';

// Implementation of the BanDatabase that overrides all methods with mocked out behaviour, in
// order to avoid hitting the actual database.
export class MockBanDatabase extends BanDatabase {
    addedEntry = null;

    constructor(...params) {
        super(...params);
    }

    // Overridden.
    async _addEntryQuery(params) {
        this.addedEntry = params;
        return true;
    }
}
