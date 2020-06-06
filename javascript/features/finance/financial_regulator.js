// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { FinancialNativeCalls } from 'features/finance/financial_natives.js';
import { MoneyIndicator } from 'features/finance/visual/money_indicator.js';
import ScopedCallbacks from 'base/scoped_callbacks.js';

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

    callbacks_ = null;
    nativeCalls_ = null;
    settings_ = null;

    constructor(settings, FinancialNativeCallsConstructor = FinancialNativeCalls) {
        this.nativeCalls_ = new FinancialNativeCallsConstructor();
        this.settings_ = settings;

        this.callbacks_ = new ScopedCallbacks();
        this.callbacks_.addEventListener(
            'playerspawn', FinancialRegulator.prototype.onPlayerSpawn.bind(this));

        server.playerManager.addObserver(this);
    }

    // Gets the amount of spawn money players are supposed to get when they spawn.
    get spawnMoney() { return this.settings_().getValue('financial/spawn_money'); }

    // ---------------------------------------------------------------------------------------------
    // Section: bank account
    // ---------------------------------------------------------------------------------------------

    // Called when the |player| has identified to their account. All the money they were carrying
    // during their previous session will be refunded. They might get some more spawn money too.
    onPlayerLogin(player) {
        this.setPlayerCashAmount(player, player.account.cashBalance);
    }

    // Called when a player has spawned in the world. Award them their spawn money.
    onPlayerSpawn(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player)
            return;  // the |player| has not identified to their account yet

        if (player.activity !== Player.PLAYER_ACTIVITY_NONE || player.syncedData.minigameName)
            return;  // the |player| is doing some activity, skip this for now

        this.setPlayerCashAmount(player, player.account.cashBalance + this.spawnMoney);
    }

    // ---------------------------------------------------------------------------------------------
    // Section: bank account
    // ---------------------------------------------------------------------------------------------

    // Returns the current account balance from |player|.
    getAccountBalance(player) {
        return player.account.bankAccountBalance;
    }
    
    // Deposits the given |amount| to the account owned by |player|. Will throw in case the deposit
    // for whatever reason is not possible.
    depositToAccount(player, amount) {
        const currentBalance = this.getAccountBalance(player);

        if (amount < 0)
            throw new Error('This method must not be used for withdrawing money.');

        if ((FinancialRegulator.kMaximumBankAmount - currentBalance) < amount)
            throw new Error('Deposit would push the account past its limit.');
        
        player.account.bankAccountBalance = currentBalance + amount;
        return true;
    }

    // Withdraws the given |amount| from the account owned by |player|. Will throw in case the
    // withdrawal is not possible for any reason, for example because they're out of money.
    withdrawFromAccount(player, amount) {
        const currentBalance = this.getAccountBalance(player);

        if (amount < 0)
            throw new Error('This method must not be used for depositing money.');
        
        if ((FinancialRegulator.kMinimumBankAmount + currentBalance) < amount)
            throw new Error('Withdrawal would push account below its limit.');
        
        player.account.bankAccountBalance = currentBalance - amount;
        return true;
    }

    // ---------------------------------------------------------------------------------------------
    // Section: cash money
    // ---------------------------------------------------------------------------------------------

    // Returns the amount of cash money the |player| is currently carrying.
    getPlayerCashAmount(player) {
        return player.account.cashBalance;
    }

    // Updates the amount of cash money the |player| is currently carrying to the given |amount|.
    // The |isAdjustment| flag should only be used by the FinancialDispositionMonitor when aligning
    // our internal metrics with the player's.
    setPlayerCashAmount(player, amount, isAdjustment = false) {
        if (amount < FinancialRegulator.kMinimumCashAmount)
            amount = FinancialRegulator.kMinimumCashAmount;
        
        if (amount > FinancialRegulator.kMaximumCashAmount)
            amount = FinancialRegulator.kMaximumCashAmount;
        
        const difference = amount - player.account.cashBalance;

        player.account.cashBalance = amount;
        if (isAdjustment)
            return;  // silent adjustment, all done here

        player.score = amount;

        MoneyIndicator.showForPlayer(player, difference);

        this.nativeCalls_.givePlayerMoney(player, difference);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.playerManager.removeObserver(this);

        this.callbacks_.dispose();
        this.callbacks_ = null;
    }
}
