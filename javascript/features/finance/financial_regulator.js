// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { FinancialDatabase } from 'features/finance/financial_database.js';
import { FinancialNativeCalls } from 'features/finance/financial_natives.js';
import { MockFinancialDatabase } from 'features/finance/test/mock_financial_database.js';
import { MoneyIndicator } from 'features/finance/visual/money_indicator.js';

// The financial regulator is responsible for managing money in Las Venturas Playground. It
// maintains its own books, and will continuously align player's own monitary values with it. Some
// minor exceptions exist for casinos.
export class FinancialRegulator {
    // Boundary values for the amount of cash a player is allowed to carry on their person. This is
    // limited by the money handling code in SA-MP and GTA:SA. UI only allows for $99,999,999.
    static kMaximumCashAmount = 999999999;
    static kMinimumCashAmount = -999999999;

    // Bounary values for the amount of money a player's able to store in their bank account. These
    // are the absolute boundaries, other limits might be imposed by other systems.
    static kMaximumBankAmount = 5354228880;
    static kMinimumBankAmount = 0;

    nativeCalls_ = null;
    database_ = null;

    // Map from |player| => |amount|, indicating the amount of cash they carry.
    cash_ = new WeakMap();

    // Map from |player| => |amount|, indicating the amount of money in their bank account.
    balance_ = new WeakMap();

    constructor(FinancialNativeCallsConstructor = FinancialNativeCalls) {
        this.nativeCalls_ = new FinancialNativeCallsConstructor();
        this.database_ = server.isTest() ? new MockFinancialDatabase()
                                         : new FinancialDatabase();

        server.playerManager.addObserver(this);
    }

    // ---------------------------------------------------------------------------------------------
    // Section: bank account
    // ---------------------------------------------------------------------------------------------

    // Returns the current account balance from |player|.
    async getAccountBalance(player) {
        if (!this.balance_.has(player))
            this.balance_.set(player, await this.database_.getPlayerAccountBalance(player));
        
        return this.balance_.get(player);
    }
    
    // Deposits the given |amount| to the account owned by |player|. Will throw in case the deposit
    // for whatever reason is not possible.
    async depositToAccount(player, amount) {
        const currentBalance = await this.getAccountBalance(player);  // force load

        if (amount < 0)
            throw new Error('This method must not be used for withdrawing money.');

        if ((FinancialRegulator.kMaximumBankAmount - currentBalance) < amount)
            throw new Error('Deposit would push the account past its limit.');
        
        this.balance_.set(player, currentBalance + amount);
        return true;
    }

    // Withdraws the given |amount| from the account owned by |player|. Will throw in case the
    // withdrawal is not possible for any reason, for example because they're out of money.
    async withdrawFromAccount(player, amount) {
        const currentBalance = await this.getAccountBalance(player);  // force load

        if (amount < 0)
            throw new Error('This method must not be used for depositing money.');
        
        if ((FinancialRegulator.kMinimumBankAmount + currentBalance) < amount)
            throw new Error('Withdrawal would push account below its limit.');
        
        this.balance_.set(player, currentBalance - amount);
        return true;
    }

    // Called when the given |player| disconnects from Las Venturas Playground. We have to write
    // the new bank account balance to the database if they used it this session.
    onPlayerDisconnect(player) {
        if (!this.balance_.has(player))
            return;  // no mutations
        
        this.database_.setPlayerAccountBalance(player, this.balance_.get(player));
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
        
        const difference = amount - this.getPlayerCashAmount(player);

        this.cash_.set(player, amount);
        if (isAdjustment)
            return;  // silent adjustment, all done here

        MoneyIndicator.showForPlayer(player, difference);

        this.nativeCalls_.givePlayerMoney(player, difference);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.playerManager.removeObserver(this);
    }
}
