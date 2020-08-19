// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/commands/command_builder.js';
import { FinancialCommunityContribution } from 'features/finance/financial_community_contribution.js';
import { FinancialRegulator } from 'features/finance/financial_regulator.js';

import { messages } from 'features/finance/finance.messages.js';

// Responsible for providing players with the ability to interact with the financial regulator and
// supporting services, by introducing a series of commands.
export class FinancialCommands {
    #announce_ = null;
    #regulator_ = null;

    constructor(announce, regulator) {
        this.#announce_ = announce;
        this.#regulator_ = regulator;

        // /balance
        server.commandManager.buildCommand('balance')
            .description('Displays the balance on your account.')
            .build(FinancialCommands.prototype.onBalanceCommand.bind(this));

        // /bank [[amount] | all]
        server.commandManager.buildCommand('bank')
            .description('Deposits money into your account.')
            .sub('all')
                .description('Deposits all your money into your account.')
                .build(FinancialCommands.prototype.onBankCommand.bind(this))
            .parameters([{ name: 'amount', type: CommandBuilder.kTypeNumber }])
            .build(FinancialCommands.prototype.onBankCommand.bind(this));

        // /givecash [player] [amount]
        server.commandManager.buildCommand('givecash')
            .description('Transfer money to another player.')
            .parameters([
                { name: 'player', type: CommandBuilder.kTypePlayer },
                { name: 'amount', type: CommandBuilder.kTypeNumber }
            ])
            .build(FinancialCommands.prototype.onGiveCashCommand.bind(this));

        // /withdraw [[amount] | all]
        server.commandManager.buildCommand('withdraw')
            .description('Withdraws money from your account.')
            .sub('all')
                .description('Withdraws all your money from your account.')
                .build(FinancialCommands.prototype.onWithdrawCommand.bind(this))
            .parameters([{ name: 'amount', type: CommandBuilder.kTypeNumber }])
            .build(FinancialCommands.prototype.onWithdrawCommand.bind(this));
    }

    // /balance
    //
    // Displays the current balance of the player's bank account.
    async onBalanceCommand(player) {
        if (!this.requireRegisteredPlayer(player))
            return;

        const balance = await this.#regulator_.getAccountBalance(player);
        player.sendMessage(Message.BANK_BALANCE, balance, FinancialRegulator.kMaximumBankAmount);
    }

    // /bank [[amount] | all]
    //
    // Allows the player to bank the given |amount| of money into their bank account. They must have
    // at least that |amount| of money on them in cash.
    async onBankCommand(player, amount) {
        if (!this.requireRegisteredPlayer(player))
            return;

        const cash = this.#regulator_.getPlayerCashAmount(player);
        if (!amount)
            amount = cash;

        if (amount > cash) {
            player.sendMessage(Message.BANK_NOT_ENOUGH_CASH, amount);
            return;
        }

        const balance = await this.#regulator_.getAccountBalance(player);
        const availableBalance = FinancialRegulator.kMaximumBankAmount - balance;

        if (availableBalance < amount) {
            player.sendMessage(
                Message.BANK_NO_AVAILABLE_BALANCE, FinancialRegulator.kMaximumBankAmount);
            return;
        }

        await this.#regulator_.depositToAccount(player, amount);
        this.#regulator_.setPlayerCashAmount(player, cash - amount)

        player.sendMessage(Message.BANK_STORED, amount, balance + amount);
    }

    // /givecash [player] [amount]
    //
    // Called when the |player| wishes to transfer |amount| dollars to the given |target|.
    async onGiveCashCommand(player, target, amount) {
        if (amount <= 0 || amount > FinancialRegulator.kMaximumCashAmount) {
            return player.sendMessage(messages.finance_give_cash_invalid_amount, {
                maximum: FinancialRegulator.kMaximumCashAmount,
            });
        }

        const cash = this.#regulator_.getPlayerCashAmount(player);
        if (amount > cash) {
            return player.sendMessage(messages.finance_give_cash_insufficient_funds, {
                amount, cash,
            });
        }

        const recipientCash = this.#regulator_.getPlayerCashAmount(target);
        if ((recipientCash + amount) > FinancialRegulator.kMaximumCashAmount) {
            return player.sendMessage(messages.finance_give_cash_insufficient_wallet, {
                limit: FinancialRegulator.kMaximumCashAmount - recipientCash,
                target,
            });
        }

        // Withdraw the |amount| from the amount of money the |player| is carrying.
        this.#regulator_.setPlayerCashAmount(player, cash - amount);

        // Easter egg: if the |target| is a non-player character, donate the money to charity
        // instead. This probably was a typo, and administrators can sort them out if need be.
        if (target.isNonPlayerCharacter()) {
            const fund = FinancialCommunityContribution.getRandomOrganisation();

            player.sendMessage(messages.finance_give_cash_npc_donation_target, { fund, target });
            player.sendMessage(messages.finance_give_cash_npc_donation_amount, { amount });

            // Tell administrators about this transaction, in case they're eager to help out the
            // |player| in recovering their money. They don't have to, though :)
            this.#announce_().broadcast(
                'admin/abuse/money-transfers', messages.finance_give_cash_admin_donation,
                { player, amount, fund });

            return;
        }

        // Give the money to the |target| not that we know they're human.
        this.#regulator_.setPlayerCashAmount(target, recipientCash + amount);

        // Tell both the |player| and the |target| about this successful transaction.
        player.sendMessage(messages.finance_give_cash_sent, { amount, target });
        target.sendMessage(messages.finance_give_cash_received, { amount, player });

        // Tell administrators about this transaction. Messages are disabled by default.
        this.#announce_().broadcast(
            'admin/abuse/money-transfers', messages.finance_give_cash_admin_transfer,
            { player, amount, target });
    }

    // /withdraw [[amount] | all]
    //
    // Withdraws the given |amount| of money from their bank account. They must have an appropriate
    // balance in order to be able to do this. Withdrawing money is subject to GTA: San Andreas
    // money limits, i.e. not being able to carry more than $999,999,999.
    async onWithdrawCommand(player, amount) {
        if (!this.requireRegisteredPlayer(player))
            return;

        const balance = await this.#regulator_.getAccountBalance(player);
        if (!amount)
            amount = balance;

        if (amount > balance) {
            player.sendMessage(Message.BANK_NOT_ENOUGH_FUNDS, amount);
            return;
        }

        const cash = this.#regulator_.getPlayerCashAmount(player);
        const availableCash = FinancialRegulator.kMaximumCashAmount - cash;

        if (availableCash < amount) {
            player.sendMessage(
                Message.BANK_NO_AVAILABLE_CASH, FinancialRegulator.kMaximumCashAmount);
            return;
        }

        await this.#regulator_.withdrawFromAccount(player, amount);
        this.#regulator_.setPlayerCashAmount(player, cash + amount)

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
        server.commandManager.removeCommand('withdraw');
        server.commandManager.removeCommand('givecash');
        server.commandManager.removeCommand('bank');
        server.commandManager.removeCommand('balance');
    }
}
