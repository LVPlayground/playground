// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { FinancialDatabase } from 'features/finance/financial_database.js';

// Mock implementation of the financial database, responsible for overriding the methods that end
// up executing queries. This enables the full system to be usable in testing environments as well.
export class MockFinancialDatabase extends FinancialDatabase {
    readCalls = 0;
    writeCalls = 0;

    async getPlayerAccountBalance(player) {
        this.readCalls++;
        return 0;
    }

    async setPlayerAccountBalance(player) {
        this.writeCalls++;
    }
}
