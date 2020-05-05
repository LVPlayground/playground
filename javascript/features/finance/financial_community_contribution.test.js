// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { FinancialCommunityContribution,
         kInitialCollectionDelayMs } from 'features/finance/financial_community_contribution.js';
import { FinancialRegulator } from 'features/finance/financial_regulator.js';

import { MockFinancialNativeCalls } from 'features/finance/test/mock_financial_native_calls.js';

describe('FinancialCommunityContribution', (it, beforeEach) => {
    let contribution = null;
    let gunther = null;
    let regulator = null;
    let settings = null;

    beforeEach(() => {
        gunther = server.playerManager.getById(/* Gunther= */ 0);
        settings = server.featureManager.loadFeature('settings');

        regulator = new FinancialRegulator(MockFinancialNativeCalls);
        contribution = new FinancialCommunityContribution(regulator, settings);
    });

    it('should collect contributions depending on player status', async (assert) => {
        const guestBase = settings.getValue('financial/community_contribution_guest_base');
        const playerBase = settings.getValue('financial/community_contribution_player_base');
        const vipBase = settings.getValue('financial/community_contribution_vip_base');

        regulator.setPlayerCashAmount(gunther, guestBase + 1000000);

        let russell = server.playerManager.getById(/* Russell= */ 1);
        russell.identify({ vip: 0 });

        regulator.setPlayerCashAmount(russell, playerBase + 1000000);

        let lucy = server.playerManager.getById(/* Lucy= */ 2);
        lucy.identify({ vip: 1 });

        regulator.setPlayerCashAmount(lucy, vipBase + 1000000);

        const collectionPromise = contribution.collect();
        await server.clock.advance(kInitialCollectionDelayMs);

        const guestPercentage = settings.getValue('financial/community_contribution_guest_pct');
        const playerPercentage = settings.getValue('financial/community_contribution_player_pct');
        const vipPercentage = settings.getValue('financial/community_contribution_vip_pct');

        assert.equal(
            regulator.getPlayerCashAmount(gunther),
            guestBase + (1000000 - Math.floor(1000000 * (guestPercentage / 100))));
    
        assert.equal(
            regulator.getPlayerCashAmount(russell),
            playerBase + (1000000 - Math.floor(1000000 * (playerPercentage / 100))));
        
        assert.equal(
            regulator.getPlayerCashAmount(lucy),
            vipBase + (1000000 - Math.floor(1000000 * (vipPercentage / 100))));

        contribution.dispose();

        await Promise.all([
            server.clock.advance(
                settings.getValue('financial/community_contribution_cycle_sec') * 1000),
            collectionPromise
        ]);
    });

    it('should collect contributions at the configured frequency', async (assert) => {
        settings.setValue('financial/community_contribution_guest_base', 1000);
        settings.setValue('financial/community_contribution_guest_pct', 10);
        settings.setValue('financial/community_contribution_cycle_sec', 50);

        regulator.setPlayerCashAmount(gunther, 2000);

        const collectionPromise = contribution.collect();
        await server.clock.advance(kInitialCollectionDelayMs);

        assert.equal(regulator.getPlayerCashAmount(gunther), 1900);

        settings.setValue('financial/community_contribution_cycle_sec', 20);
        await server.clock.advance(50 * 1000);

        assert.equal(regulator.getPlayerCashAmount(gunther), 1810);

        settings.setValue('financial/community_contribution_cycle_sec', 10);
        await server.clock.advance(20 * 1000);

        assert.equal(regulator.getPlayerCashAmount(gunther), 1729);

        contribution.dispose();

        await Promise.all([
            server.clock.advance(10 * 1000),
            collectionPromise
        ]);
    });

    it('should have a variety of messages to share with players', async (assert) => {

    });

    it.fails();
});
