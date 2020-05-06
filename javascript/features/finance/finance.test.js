// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { FinancialRegulator } from 'features/finance/financial_regulator.js';

describe('Finance', it => {
    it('has a functional public API', assert => {
        const finance = server.featureManager.loadFeature('finance');
        const regulator = finance.regulator_;

        const gunther = server.playerManager.getById(/* Gunther= */ 0);

        assert.equal(finance.getPlayerCash(gunther), 0);
        assert.equal(regulator.getPlayerCashAmount(gunther), 0);

        assert.isTrue(finance.givePlayerCash(gunther, 1000));
        assert.equal(regulator.getPlayerCashAmount(gunther), 1000);

        assert.isFalse(finance.givePlayerCash(gunther, FinancialRegulator.kMaximumCashAmount));
        assert.equal(regulator.getPlayerCashAmount(gunther), 1000);

        assert.isTrue(finance.takePlayerCash(gunther, 1000));
        assert.equal(regulator.getPlayerCashAmount(gunther), 0);

        assert.isFalse(finance.takePlayerCash(
            gunther, Math.abs(FinancialRegulator.kMinimumCashAmount) + 5));
        assert.equal(regulator.getPlayerCashAmount(gunther), 0);
    });
});
