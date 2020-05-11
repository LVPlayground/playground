// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { FinancialRegulator } from 'features/finance/financial_regulator.js';

describe('FinancialCommands', (it, beforeEach) => {
    let gunther = null;
    let lucy = null;
    let regulator = null;

    beforeEach(async() => {
        gunther = server.playerManager.getById(/* Gunther= */ 0);

        lucy = server.playerManager.getById(/* Lucy= */ 2);
        await lucy.identify();

        regulator = server.featureManager.loadFeature('finance').regulator_;
    });

    it('should limit bank account-related commands to registered players', async (assert) => {
        assert.isTrue(await gunther.issueCommand('/balance'));
        assert.equal(gunther.messages.length, 1);
        assert.includes(gunther.messages[0], Message.format(Message.BANK_NEED_ACCOUNT));

        assert.isTrue(await gunther.issueCommand('/bank 12345'));
        assert.equal(gunther.messages.length, 2);
        assert.includes(gunther.messages[1], Message.format(Message.BANK_NEED_ACCOUNT));
        
        assert.isTrue(await gunther.issueCommand('/withdraw 12345'));
        assert.equal(gunther.messages.length, 3);
        assert.includes(gunther.messages[2], Message.format(Message.BANK_NEED_ACCOUNT));
    });

    it('is able to display the current balance of a player', async (assert) => {
        assert.isTrue(await lucy.issueCommand('/balance'));
        assert.equal(lucy.messages.length, 1);
        assert.equal(
            lucy.messages[0],
            Message.format(Message.BANK_BALANCE, 0, FinancialRegulator.kMaximumBankAmount));

        await regulator.depositToAccount(lucy, 123456789);

        assert.isTrue(await lucy.issueCommand('/balance'));
        assert.equal(lucy.messages.length, 2);
        assert.equal(
            lucy.messages[1],
            Message.format(Message.BANK_BALANCE, 123456789, FinancialRegulator.kMaximumBankAmount));
    });

    it('is able to deposit monies in a player account', async (assert) => {
        assert.equal(await regulator.getAccountBalance(lucy), 0);

        regulator.setPlayerCashAmount(lucy, 9000);

        assert.isTrue(await lucy.issueCommand('/bank 10000'));
        assert.equal(lucy.messages.length, 1);
        assert.equal(
            lucy.messages[0], Message.format(Message.BANK_NOT_ENOUGH_CASH, 10000));

        assert.isTrue(await lucy.issueCommand('/bank 8000'));
        assert.equal(lucy.messages.length, 2);
        assert.equal(
            lucy.messages[1], Message.format(Message.BANK_STORED, 8000, 8000));

        assert.equal(await regulator.getAccountBalance(lucy), 8000);
        assert.equal(regulator.getPlayerCashAmount(lucy), 1000);

        await regulator.depositToAccount(lucy, FinancialRegulator.kMaximumBankAmount - 8015);

        assert.isTrue(await lucy.issueCommand('/bank 500'));
        assert.equal(lucy.messages.length, 3);
        assert.equal(
            lucy.messages[2],
            Message.format(Message.BANK_NO_AVAILABLE_BALANCE, FinancialRegulator.kMaximumBankAmount));
    });

    it('is able to deposit all of monies carried by a player', async (assert) => {
        assert.equal(await regulator.getAccountBalance(lucy), 0);

        regulator.setPlayerCashAmount(lucy, 9000);

        assert.isTrue(await lucy.issueCommand('/bank all'));
        assert.equal(lucy.messages.length, 1);
        assert.equal(
            lucy.messages[0], Message.format(Message.BANK_STORED, 9000, 9000));
        
        assert.equal(await regulator.getAccountBalance(lucy), 9000);

        regulator.setPlayerCashAmount(lucy, 9000);

        assert.isTrue(await lucy.issueCommand('/bank 0'));
        assert.equal(lucy.messages.length, 2);
        assert.equal(
            lucy.messages[1], Message.format(Message.BANK_STORED, 9000, 18000));
        
        assert.equal(await regulator.getAccountBalance(lucy), 18000);
    });

    it('is able to withdraw money from a bank account', async (assert) => {
        await regulator.depositToAccount(lucy, 10000);

        assert.isTrue(await lucy.issueCommand('/withdraw 8000'));
        assert.equal(lucy.messages.length, 1);
        assert.equal(
            lucy.messages[0], Message.format(Message.BANK_WITHDRAWN, 8000, 2000));
        
        assert.isTrue(await lucy.issueCommand('/withdraw all'));
        assert.equal(lucy.messages.length, 2);
        assert.equal(
            lucy.messages[1], Message.format(Message.BANK_WITHDRAWN, 2000, 0));
        
        await regulator.depositToAccount(lucy, 500);
        regulator.setPlayerCashAmount(lucy, FinancialRegulator.kMaximumCashAmount - 15);

        assert.isTrue(await lucy.issueCommand('/withdraw 500'));
        assert.equal(lucy.messages.length, 3);
        assert.equal(
            lucy.messages[2],
            Message.format(Message.BANK_NO_AVAILABLE_CASH, FinancialRegulator.kMaximumCashAmount));
    });
});
