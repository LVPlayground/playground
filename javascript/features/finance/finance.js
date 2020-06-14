// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { FinancialCommands } from 'features/finance/financial_commands.js';
import { FinancialCommunityContribution } from 'features/finance/financial_community_contribution.js';
import { FinancialDispositionMonitor } from 'features/finance/financial_disposition_monitor.js';
import { FinancialNatives } from 'features/finance/financial_natives.js';
import { FinancialRegulator } from 'features/finance/financial_regulator.js';
import { Feature } from 'components/feature_manager/feature.js';

// Introduces everything related to the financial situation in San Andreas to the server. Maintains
// track of money, allows players to interact with it, and gives them a bank account.
export default class Finance extends Feature {
    commands_ = null;
    communityContribution_ = null;
    dispositionMonitor_ = null;
    natives_ = null;
    regulator_ = null;

    constructor() {
        super();

        this.markFoundational();

        // Many parts about the in-game financial situation are configurable.
        const settings = this.defineDependency('settings');

        // Responsible for doing the actual bookkeeping associated with in-game money.
        this.regulator_ = new FinancialRegulator(settings);

        // Community contributions are periodically taken from the money players carry with them in
        // cash. This is a form of tax, just with a nicer name because it feels better.
        this.communityContribution_ =
            new FinancialCommunityContribution(this.regulator_, settings);

        if (!server.isTest())
            this.communityContribution_.collect();

        // The disposition monitor is responsible for keeping player state in sync with what the
        // regulator has in their books. It's not relevant when running tests.
        this.dispositionMonitor_ = new FinancialDispositionMonitor(this.regulator_);

        if (!server.isTest())
            this.dispositionMonitor_.monitor();

        // Pawn native functions to enable the other part of our gamemode to work with money.
        this.natives_ = new FinancialNatives(this.regulator_);

        // Commands that enable players to interact with their in-game money.
        this.commands_ = new FinancialCommands(this.regulator_);
    }

    // ---------------------------------------------------------------------------------------------
    // Public API of the Finance feature
    // ---------------------------------------------------------------------------------------------

    // Returns the current account balance in the |player|'s bank account.
    async getPlayerAccountBalance(player) {
        return this.regulator_.getAccountBalance(player);
    }

    // Deposits |amount| dollars in the bank account owned by |player|.
    async depositToPlayerAccount(player, amount) {
        return this.regulator_.depositToAccount(player, amount);
    }

    // Withdraws |amount| dollars from the bank account owned by |player|.
    async withdrawFromPlayerAccount(player, amount) {
        return this.regulator_.withdrawFromAccount(player, amount);
    }

    // Returns the amount in cash the |player| is currently carrying.
    getPlayerCash(player) {
        return this.regulator_.getPlayerCashAmount(player);
    }

    // Gives the |player| the given |amount|. Returns whether the money has been given to them,
    // which only fails when limits would be exceeded.
    givePlayerCash(player, amount) {
        if (amount < 0)
            throw new Error('This method may only be used to issue money to a player.');

        const balance = this.regulator_.getPlayerCashAmount(player);
        if ((FinancialRegulator.kMaximumCashAmount - balance) < amount)
            return false;
        
        this.regulator_.setPlayerCashAmount(player, balance + amount);
        return true;
    }

    // Takes the given |amount| from the |player|. This is able to put them in debt. Returns whether
    // the money was taken from them, which only fails when limits would be exceeded.
    takePlayerCash(player, amount) {
        if (amount < 0)
            throw new Error('This method may only be used to take money from a player.');

        const balance = this.regulator_.getPlayerCashAmount(player);
        if ((FinancialRegulator.kMinimumCashAmount + amount) > balance)
            return false;

        this.regulator_.setPlayerCashAmount(player, balance - amount);
        return true;
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.commands_.dispose();
        this.natives_.dispose();
        this.dispositionMonitor_.dispose();
        this.communityContribution_.dispose();
        this.regulator_.dispose();
    }
}
