// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { FinancialDatabase } from 'features/finance/financial_database.js';
import { FinancialNativeCalls } from 'features/finance/financial_natives.js';
import { MockFinancialDatabase } from 'features/finance/test/mock_financial_database.js';

// The financial regulator is responsible for managing money in Las Venturas Playground. It
// maintains its own books, and will continuously align player's own monitary values with it. Some
// minor exceptions exist for casinos.
export class FinancialRegulator {
    // Boundary values for the amount of cash a player is allowed to carry on their person. This is
    // limmited to the display in player UI, which only carries nine digits.
    static kMaximumCashAmount = 999999999;
    static kMinimumCashAmount = -999999999;

    // Bounary values for the amount of money a player's able to store in their bank account. These
    // are the absolute boundaries, other limits might be imposed by other systems.
    static kMaximumBankAmount = 2147483647;
    static kMinimumBankAmount = 0;

    nativeCalls_ = null;
    database_ = null;

    // Map from |player| => |amount|, indicating the amount of cash they own.
    cash_ = new WeakMap();

    constructor(FinancialNativeCallsConstructor = FinancialNativeCalls) {
        this.nativeCalls_ = new FinancialNativeCallsConstructor();
        this.database_ = server.isTest() ? new MockFinancialDatabase()
                                         : new FinancialDatabase();
    }

    // ---------------------------------------------------------------------------------------------
    // Section: cash money
    // ---------------------------------------------------------------------------------------------

    // Returns the amount of cash money the |player| is currently carrying.
    getPlayerCashAmount(player) {
        return this.cash_.get(player) || 0;
    }

    // Updates the amount of cash money the |player| is currently carrying to the given |amount|.
    // The |isAdjustment| flag should only be used by the FinancialDispositionMonitor when aligning
    // our internal metrics with the player's.
    setPlayerCashAmount(player, amount, isAdjustment = false) {
        if (amount < FinancialRegulator.kMinimumCashAmount)
            amount = FinancialRegulator.kMinimumCashAmount;
        
        if (amount > FinancialRegulator.kMaximumCashAmount)
            amount = FinancialRegulator.kMaximumCashAmount;
        
        if (!isAdjustment)
            this.nativeCalls_.givePlayerMoney(player, amount - this.getPlayerCashAmount(player));

        this.cash_.set(player, amount);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        
    }
}
