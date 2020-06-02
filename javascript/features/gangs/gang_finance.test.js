// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import MockGangDatabase from 'features/gangs/test/mock_gang_database.js';

describe('GangFinance', (it, beforeEach) => {
    let gunther = null;
    let manager = null;
    let finance = null;

    beforeEach(() => {
        const feature = server.featureManager.loadFeature('gangs');

        gunther = server.playerManager.getById(/* Gunther= */ 0);
        manager = feature.manager_;
        finance = manager.finance;
    });

    it('is able to understand the balance of represented and offline gangs', async (assert) => {
        await gunther.identify({ userId: MockGangDatabase.CC_LEADER_USER_ID });

        // (1) Get the balance of an offline gang. This will be fetched from the database, where
        // the bank account balance defaults to 25 million dollars.
        assert.equal(await finance.getAccountBalance(1337), 25000000);

        // (2) Get the bank account balance of an online gang, which we will create first.
        const gang = await manager.createGangForPlayer(gunther, 'CC', 'name', 'goal');
        assert.equal(await finance.getAccountBalance(gang.id), 0);
    });

    it('is able to withdraw and deposit money into a bank account', async (assert) => {
        await gunther.identify({ userId: MockGangDatabase.CC_LEADER_USER_ID });

        const gang = await manager.createGangForPlayer(gunther, 'CC', 'name', 'goal');

        assert.equal(gang.balance, 0);

        await finance.depositToAccount(gang.id, gunther.account.userId, 2500, 'Deposit');

        assert.equal(gang.balance, 2500);

        await finance.withdrawFromAccount(gang.id, gunther.account.userId, 1000, 'Withdrawal');

        assert.equal(gang.balance, 1500);
    });
});
