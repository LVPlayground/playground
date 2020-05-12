// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { AccountProviderDatabase } from 'features/account_provider/account_provider_database.js';

// Mock implementation of the AccountProviderDatabase, which provides the necessary interactions
// to test account-related functionality in tests without hitting the actual database.
export class MockAccountProviderDatabase extends AccountProviderDatabase {
    // Overridden.
    async loadAccountData(userId) {
        return {
            user_id: userId,
            money_bank: 0,
            stats_reaction: 0,
            muted: 0,
        };
    }

    // Overridden.
    async saveAccountData(accountData) {
        return true;
    }
}
