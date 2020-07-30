// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/command_manager/command_builder.js';
import { FinancialRegulator } from 'features/finance/financial_regulator.js';

// Responsible for providing players with the ability to interact with the financial regulator and
// supporting services, by introducing a series of commands.
export class FinancialCommands {
    constructor(regulator) {
        this.regulator_ = regulator;

        // /balance
        server.deprecatedCommandManager.buildCommand('balance')
            .build(FinancialCommands.prototype.onBalanceCommand.bind(this));

        // /bank [[amount] | all]
        server.deprecatedCommandManager.buildCommand('bank')
            .sub('all')
                .build(FinancialCommands.prototype.onBankCommand.bind(this))
            .parameters([{ name: 'amount', type: CommandBuilder.NUMBER_PARAMETER }])
            .build(FinancialCommands.prototype.onBankCommand.bind(this));

        // /withdraw [[amount] | all]
        server.deprecatedCommandManager.buildCommand('withdraw')
            .sub('all')
                .build(FinancialCommands.prototype.onWithdrawCommand.bind(this))
            .parameters([{ name: 'amount', type: CommandBuilder.NUMBER_PARAMETER }])
            .build(FinancialCommands.prototype.onWithdrawCommand.bind(this));
    }

    // /balance
    //
    // Displays the current balance of the player's bank account.
    async onBalanceCommand(player) {
        if (!this.requireRegisteredPlayer(player))
            return;

        const balance = await this.regulator_.getAccountBalance(player);
        player.sendMessage(Message.BANK_BALANCE, balance, FinancialRegulator.kMaximumBankAmount);
    }

    // /bank [[amount] | all]
    //
    // Allows the player to bank the given |amount| of money into their bank account. They must have
    // at least that |amount| of money on them in cash.
    async onBankCommand(player, amount) {
        if (!this.requireRegisteredPlayer(player))
            return;

        const cash = this.regulator_.getPlayerCashAmount(player);
        if (!amount)
            amount = cash;

        if (amount > cash) {
            player.sendMessage(Message.BANK_NOT_ENOUGH_CASH, amount);
            return;
        }

        const balance = await this.regulator_.getAccountBalance(player);
        const availableBalance = FinancialRegulator.kMaximumBankAmount - balance;

        if (availableBalance < amount) {
            player.sendMessage(
                Message.BANK_NO_AVAILABLE_BALANCE, FinancialRegulator.kMaximumBankAmount);
            return;
        }

        await this.regulator_.depositToAccount(player, amount);
        this.regulator_.setPlayerCashAmount(player, cash - amount)

        player.sendMessage(Message.BANK_STORED, amount, balance + amount);
    }

    // /withdraw [[amount] | all]
    //
    // Withdraws the given |amount| of money from their bank account. They must have an appropriate
    // balance in order to be able to do this. Withdrawing money is subject to GTA: San Andreas
    // money limits, i.e. not being able to carry more than $999,999,999.
    async onWithdrawCommand(player, amount) {
        if (!this.requireRegisteredPlayer(player))
            return;

        const balance = await this.regulator_.getAccountBalance(player);
        if (!amount)
            amount = balance;

        if (amount > balance) {
            player.sendMessage(Message.BANK_NOT_ENOUGH_FUNDS, amount);
            return;
        }

        const cash = this.regulator_.getPlayerCashAmount(player);
        const availableCash = FinancialRegulator.kMaximumCashAmount - cash;

        if (availableCash < amount) {
            player.sendMessage(
                Message.BANK_NO_AVAILABLE_CASH, FinancialRegulator.kMaximumCashAmount);
            return;
        }

        await this.regulator_.withdrawFromAccount(player, amount);
        this.regulator_.setPlayerCashAmount(player, cash + amount)

        player.sendMessage(Message.BANK_WITHDRAWN, amount, balance - amount);
    }

    // The |player| must be registered with Las Venturas Playground in order to be able to use their
    // bank account. If they aren't, display a consistent error message.
    requireRegisteredPlayer(player) {
        if (!player.account.isRegistered()) {
            player.sendMessage(Message.BANK_NEED_ACCOUNT);
            return false;
        }

        return true;
    }

    dispose() {
        server.deprecatedCommandManager.removeCommand('withdraw');
        server.deprecatedCommandManager.removeCommand('bank');
        server.deprecatedCommandManager.removeCommand('balance');
    }
}
