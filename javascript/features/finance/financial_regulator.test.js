// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { FinancialRegulator } from 'features/finance/financial_regulator.js';

import { MockFinancialNativeCalls } from 'features/finance/test/mock_financial_native_calls.js';

describe('FinancialRegulator', (it, beforeEach, afterEach) => {
    let gunther = null;
    let regulator = null;

    beforeEach(() => {
        server.featureManager.loadFeature('account');

        const settings = server.featureManager.loadFeature('settings');

        gunther = server.playerManager.getById(/* Gunther= */ 0);
        regulator = new FinancialRegulator(settings, MockFinancialNativeCalls);
    });

    afterEach(() => regulator.dispose());

    it('should have a sensible maximum balance of bank accounts', assert => {
        // Any balance outside of these numbers will cause truncation and inaccuracies.
        assert.isAboveOrEqual(FinancialRegulator.kMinimumBankAmount, Number.MIN_SAFE_INTEGER);
        assert.isBelowOrEqual(FinancialRegulator.kMaximumBankAmount, Number.MAX_SAFE_INTEGER);
    });

    it('should be able to keep track of cash money held by players', assert => {
        // Players, by default, have no cash money at all.
        assert.equal(regulator.getPlayerCashAmount(gunther), 0);

        // It could be a positive amount...
        regulator.setPlayerCashAmount(gunther, 1500);
        assert.equal(regulator.getPlayerCashAmount(gunther), 1500);
        assert.equal(MockFinancialNativeCalls.getPlayerMoneyForTesting(gunther), 1500);

        // Or a negative amount...
        regulator.setPlayerCashAmount(gunther, -1500);
        assert.equal(regulator.getPlayerCashAmount(gunther), -1500);
        assert.equal(MockFinancialNativeCalls.getPlayerMoneyForTesting(gunther), -1500);

        // And the amount has upper and lower boundaries, which it clamps to.
        regulator.setPlayerCashAmount(gunther, FinancialRegulator.kMaximumCashAmount + 1);
        assert.equal(regulator.getPlayerCashAmount(gunther), FinancialRegulator.kMaximumCashAmount);
        assert.equal(MockFinancialNativeCalls.getPlayerMoneyForTesting(gunther),
                     FinancialRegulator.kMaximumCashAmount);

        regulator.setPlayerCashAmount(gunther, FinancialRegulator.kMinimumCashAmount - 1);
        assert.equal(regulator.getPlayerCashAmount(gunther), FinancialRegulator.kMinimumCashAmount);
        assert.equal(MockFinancialNativeCalls.getPlayerMoneyForTesting(gunther),
                     FinancialRegulator.kMinimumCashAmount);
    });

    it('should be able to keep track of values in bank accounts', async (assert) => {
        await gunther.identify();

        assert.equal(await regulator.getAccountBalance(gunther), 0);
        assert.equal(gunther.account.bankAccountBalance, 0);

        assert.isTrue(await regulator.depositToAccount(gunther, 1500));
        assert.equal(await regulator.getAccountBalance(gunther), 1500);
        assert.equal(gunther.account.bankAccountBalance, 1500);

        assert.isTrue(await regulator.withdrawFromAccount(gunther, 800));
        assert.equal(await regulator.getAccountBalance(gunther), 700);
        assert.equal(gunther.account.bankAccountBalance, 700);
    });
});
