// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// WeakMap is fine here, because each test creates new Player instances.
const mockPlayerCashAmounts = new WeakMap();

// Mock implementation of the FinancialNativeCalls object defined in financial_natives.js. Will
// store data internally rather than actually calling out to the SA-MP server and players.
export class MockFinancialNativeCalls {
    static getPlayerMoneyForTesting(player) {
        return mockPlayerCashAmounts.get(player) || 0;
    }

    static setPlayerMoneyForTesting(player, amount) {
        mockPlayerCashAmounts.set(player, amount);
    }

    getPlayerMoney(player) {
        return mockPlayerCashAmounts.get(player) || 0;
    }
    givePlayerMoney(player, amount) {
        mockPlayerCashAmounts.set(player, this.getPlayerMoney(player) + amount);
    }
}
