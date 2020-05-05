// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { FinancialRegulator } from 'features/finance/financial_regulator.js';

describe('FinancialRegulator', (it, beforeEach, afterEach) => {
    let gunther = null;
    let regulator = null;

    beforeEach(() => {
        gunther = server.playerManager.getById(/* Gunther= */ 0);
        regulator = new FinancialRegulator();
    });

    afterEach(() => regulator.dispose());

    it('should be able to keep track of cash money held by players', assert => {
        // Players, by default, have no cash money at all.
        assert.equal(regulator.getPlayerCashAmount(gunther), 0);

        // It could be a positive amount...
        regulator.setPlayerCashAmount(gunther, 1500);
        assert.equal(regulator.getPlayerCashAmount(gunther), 1500);

        // Or a negative amount...
        regulator.setPlayerCashAmount(gunther, -1500);
        assert.equal(regulator.getPlayerCashAmount(gunther), -1500);

        // And the amount has upper and lower boundaries, which it clamps to.
        regulator.setPlayerCashAmount(gunther, FinancialRegulator.kMaximumCashAmount + 1);
        assert.equal(regulator.getPlayerCashAmount(gunther), FinancialRegulator.kMaximumCashAmount);

        regulator.setPlayerCashAmount(gunther, FinancialRegulator.kMinimumCashAmount - 1);
        assert.equal(regulator.getPlayerCashAmount(gunther), FinancialRegulator.kMinimumCashAmount);
    });

    it.fails();
});
