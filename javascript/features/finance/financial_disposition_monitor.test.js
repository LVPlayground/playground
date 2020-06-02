// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { FinancialDispositionMonitor,
         kCasinoAreas,
         kCasinoMaximumDifference,
         kDispositionMonitorSpinDelay,
         kPayAndSprayMaximumDifference,
         kPayAndSprayShops } from 'features/finance/financial_disposition_monitor.js';
import { FinancialRegulator } from 'features/finance/financial_regulator.js';

import { MockFinancialNativeCalls } from 'features/finance/test/mock_financial_native_calls.js';

describe('FinancialDispositionMonitor', (it, beforeEach, afterEach) => {
    let gunther = null;
    let russell = null;
    let lucy = null;

    let dispositionMonitor = null;
    let regulator = null;

    beforeEach(() => {
        gunther = server.playerManager.getById(/* Gunther= */ 0);
        russell = server.playerManager.getById(/* Russell= */ 1);
        lucy = server.playerManager.getById(/* Lucy= */ 2);

        const settings = server.featureManager.loadFeature('settings');

        regulator = new FinancialRegulator(settings, MockFinancialNativeCalls);
        dispositionMonitor = new FinancialDispositionMonitor(regulator, MockFinancialNativeCalls);
    });

    afterEach(() => regulator.dispose());

    it('corrects differences, regardless of how big the difference is', async (assert) => {
        const monitorPromise = dispositionMonitor.monitor();

        MockFinancialNativeCalls.setPlayerMoneyForTesting(gunther, -1500);
        MockFinancialNativeCalls.setPlayerMoneyForTesting(russell, 1500);
        MockFinancialNativeCalls.setPlayerMoneyForTesting(lucy, 1);

        await server.clock.advance(kDispositionMonitorSpinDelay);

        assert.equal(MockFinancialNativeCalls.getPlayerMoneyForTesting(gunther), 0);
        assert.equal(MockFinancialNativeCalls.getPlayerMoneyForTesting(russell), 0);
        assert.equal(MockFinancialNativeCalls.getPlayerMoneyForTesting(lucy), 0);

        dispositionMonitor.dispose();

        await Promise.all([
            server.clock.advance(kDispositionMonitorSpinDelay),
            monitorPromise
        ]);
    });

    it('withdraws money spent in Pay and Spray shops by the player', async (assert) => {
        const monitorPromise = dispositionMonitor.monitor();
        
        let currentMoney = MockFinancialNativeCalls.getPlayerMoneyForTesting(gunther);

        for (const shop of kPayAndSprayShops) {
            gunther.position = new Vector(shop[0] + 1, shop[2] + 1, 20.0);

            MockFinancialNativeCalls.setPlayerMoneyForTesting(
                gunther, currentMoney - kPayAndSprayMaximumDifference);

            await server.clock.advance(kDispositionMonitorSpinDelay);

            assert.equal(MockFinancialNativeCalls.getPlayerMoneyForTesting(gunther),
                         currentMoney - kPayAndSprayMaximumDifference);

            currentMoney -= kPayAndSprayMaximumDifference;
        }

        dispositionMonitor.dispose();

        await Promise.all([
            server.clock.advance(kDispositionMonitorSpinDelay),
            monitorPromise
        ]);
    });

    it('withdraws money spent by tuning a vehicle', async (assert) => {
        const monitorPromise = dispositionMonitor.monitor();

        const vehicle = server.vehicleManager.createVehicle({
            modelId: 411,
            position: new Vector(100, 200, 300),
        });

        // (1) Expenditure by purchasing a component.
        {
            MockFinancialNativeCalls.setPlayerMoneyForTesting(gunther, -5000);
            dispatchEvent('vehiclemod', {
                playerid: gunther.id,
                vehicleid: vehicle.id,
                componentid: 1000  // spoiler
            });

            await server.clock.advance(kDispositionMonitorSpinDelay);
            assert.equal(MockFinancialNativeCalls.getPlayerMoneyForTesting(gunther), -5000);
        }

        // (2) Expenditure by purchasing a new paintjob.
        {
            MockFinancialNativeCalls.setPlayerMoneyForTesting(gunther, -5000);
            await server.clock.advance(kDispositionMonitorSpinDelay);
            assert.equal(MockFinancialNativeCalls.getPlayerMoneyForTesting(gunther), -5000);
        }
    
        // (3) Expenditure by getting a vehicle respray.
        {
            MockFinancialNativeCalls.setPlayerMoneyForTesting(gunther, -5000);
            await server.clock.advance(kDispositionMonitorSpinDelay);
            assert.equal(MockFinancialNativeCalls.getPlayerMoneyForTesting(gunther), -5000);
        }

        dispositionMonitor.dispose();

        await Promise.all([
            server.clock.advance(kDispositionMonitorSpinDelay),
            monitorPromise
        ]);
    });

    it('withdraws or deposits money spent in a casino by the player', async (assert) => {
        const monitorPromise = dispositionMonitor.monitor();
        
        let currentMoney = MockFinancialNativeCalls.getPlayerMoneyForTesting(gunther);

        for (const casino of kCasinoAreas) {
            gunther.position = new Vector(casino[0] + 1, casino[2] + 1, 20.0);

            MockFinancialNativeCalls.setPlayerMoneyForTesting(
                gunther, currentMoney + kCasinoMaximumDifference);

            await server.clock.advance(kDispositionMonitorSpinDelay);

            assert.equal(MockFinancialNativeCalls.getPlayerMoneyForTesting(gunther),
                         currentMoney + kCasinoMaximumDifference);

            currentMoney += kCasinoMaximumDifference;
        }

        dispositionMonitor.dispose();

        await Promise.all([
            server.clock.advance(kDispositionMonitorSpinDelay),
            monitorPromise
        ]);
    });
});
