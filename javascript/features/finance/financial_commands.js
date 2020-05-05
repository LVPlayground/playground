// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import CommandBuilder from 'components/command_manager/command_builder.js';

// Responsible for providing players with the ability to interact with the financial regulator and
// supporting services, by introducing a series of commands.
export class FinancialCommands {
    constructor(regulator) {
        this.regulator_ = regulator;

        // /balance
        server.commandManager.buildCommand('balance')
            .build(FinancialCommands.prototype.onBalanceCommand.bind(this));

        // /bank [amount]
        server.commandManager.buildCommand('bank')
            .parameters([{ name: 'amount', type: CommandBuilder.NUMBER_PARAMETER }])
            .build(FinancialCommands.prototype.onBankCommand.bind(this));

        // /withdraw [amount]
        server.commandManager.buildCommand('withdraw')
            .parameters([{ name: 'amount', type: CommandBuilder.NUMBER_PARAMETER }])
            .build(FinancialCommands.prototype.onWithdrawCommand.bind(this));
    }

    // /balance
    //
    // Displays the current balance of the player's bank account.
    onBalanceCommand(player) {
        if (!this.requireRegisteredPlayer(player))
            return;
    }

    // /bank [amount]
    //
    // Allows the player to bank the given |amount| of money into their bank account. They must have
    // at least that |amount| of money on them in cash.
    onBankCommand(player, amount) {
        if (!this.requireRegisteredPlayer(player))
            return;
    }

    // /withdraw [amount]
    //
    // Withdraws the given |amount| of money from their bank account. They must have an appropriate
    // balance in order to be able to do this. Withdrawing money is subject to GTA: San Andreas
    // money limits, i.e. not being able to carry more than $999,999,999.
    onWithdrawCommand(player, amount) {
        if (!this.requireRegisteredPlayer(player))
            return;
    }

    // The |player| must be registered with Las Venturas Playground in order to be able to use their
    // bank account. If they aren't, display a consistent error message.
    requireRegisteredPlayer(player) {
        if (!player.isRegistered()) {
            player.sendMessage(Message.BANK_NEED_ACCOUNT);
            return false;
        }

        return true;
    }

    dispose() {
        server.commandManager.removeCommand('withdraw');
        server.commandManager.removeCommand('bank');
        server.commandManager.removeCommand('balance');
    }
}
