// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import createTestEnvironment from 'features/houses/test/test_environment.js';

// Zero-based index of the Visitor Log menu in the `/house settings` options.
const SETTINGS_MENU_INDEX = 4;

describe('VisitorLog', (it, beforeEach) => {
    let gunther = null;
    let location = null;
    let manager = null;

    beforeEach(async(assert) => {
        gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.identify({ userId: 42 });

        ({ manager } = await createTestEnvironment());

        // The `/house settings` command is only available when the player is in a house.
        manager.forceEnterHouse(
            gunther, await manager.findClosestLocation(gunther, { ignoreAvailable: true }));

        location = manager.getCurrentHouseForPlayer(gunther);

        assert.isNotNull(location);
        assert.isFalse(location.isAvailable());
    });

    it('should log players entering a house in the database', async(assert) => {
        {
            const logs = await manager.database.readVisitorLogs(location);

            assert.equal(logs.length, 1);
            assert.equal(logs[0].name, gunther.name);
        }

        const russell = server.playerManager.getById(1 /* Russell */);
        russell.identify({ userId: 5001 });

        manager.forceEnterHouse(russell, location);

        {
            const logs = await manager.database.readVisitorLogs(location);

            assert.equal(logs.length, 2);
            assert.equal(logs[0].name, russell.name);
            assert.equal(logs[1].name, gunther.name);
        }
    });

    it('should log a player entering a house at most once per five minutes', async(assert) => {
        assert.equal((await manager.database.readVisitorLogs(location)).length, 1);

        manager.forceEnterHouse(gunther, location);
        manager.forceEnterHouse(gunther, location);
        manager.forceEnterHouse(gunther, location);

        assert.equal((await manager.database.readVisitorLogs(location)).length, 1);

        await server.clock.advance(10 * 60 * 1000);  // 10 minutes

        manager.forceEnterHouse(gunther, location);

        assert.equal((await manager.database.readVisitorLogs(location)).length, 2);

        manager.forceEnterHouse(gunther, location);
        manager.forceEnterHouse(gunther, location);
        manager.forceEnterHouse(gunther, location);

        assert.equal((await manager.database.readVisitorLogs(location)).length, 2);
    });

    it('should not display the menu item for regular players', async(assert) => {
        assert.isFalse(gunther.isVip());

        gunther.respondToDialog({ response: 0 /* Close the dialog */ });

        assert.isTrue(await gunther.issueCommand('/house settings'));
        assert.isFalse(gunther.lastDialog.includes('Recent visitors'));

        gunther.setVip(true);

        gunther.respondToDialog({ response: 0 /* Close the dialog */ });

        assert.isTrue(await gunther.issueCommand('/house settings'));
        assert.isTrue(gunther.lastDialog.includes('Recent visitors'));
    });

    it('should display a dialog when nobody else has entered their house yet', async(assert) => {
        gunther.setVip(true);

        const visitors =
            await manager.database.readVisitorLogs(location, 10, true /* ignoreOwner */);
        assert.equal(visitors.length, 0);

        gunther.respondToDialog({ listitem: SETTINGS_MENU_INDEX }).then(
            () => gunther.respondToDialog({ response: 0 /* Close the dialog */ }));

        assert.isTrue(await gunther.issueCommand('/house settings'));
        assert.equal(gunther.lastDialog, Message.HOUSE_SETTINGS_NO_VISITORS);
    });

    it('should display the most recent visitors when these are available', async(assert) => {
        gunther.setVip(true);

        const russell = server.playerManager.getById(1 /* Russell */);
        russell.identify({ userId: 5001 });

        manager.forceEnterHouse(russell, location);

        const visitors =
            await manager.database.readVisitorLogs(location, 10, true /* ignoreOwner */);
        assert.equal(visitors.length, 1);

        const testCases = [
            { text: 'Just now!',        advance: 0 },
            { text: '1 minute ago',     advance: 60 * 1000 },
            { text: '2 minutes ago',    advance: 60 * 1000 },
            { text: '1 hour ago',       advance: 58 * 60 * 1000 },
            { text: '2 hours ago',      advance: 60 * 60 * 1000 },
            { text: '1 day ago',        advance: 22 * 60 * 60 * 1000 },
            { text: '2 days ago',       advance: 24 * 60 * 60 * 1000 },
            { text: '1 week ago',       advance: 6 * 24 * 60 * 60 * 1000 },
            { text: '2 weeks ago',      advance: 7 * 24 * 60 * 60 * 1000 },
            { text: '1 month ago',      advance: 20 * 24 * 60 * 60 * 1000 },
            { text: '2 months ago',     advance: 31 * 24 * 60 * 60 * 1000 },
            { text: '1 year ago',       advance: 365 * 24 * 60 * 60 * 1000 },
            { text: '2 years ago',      advance: 365 * 24 * 60 * 60 * 1000 }
        ];

        for (const testCase of testCases) {
            await server.clock.advance(testCase.advance);

            gunther.respondToDialog({ listitem: SETTINGS_MENU_INDEX }).then(
                () => gunther.respondToDialog({ response: 0 /* Close the dialog */ }));

            assert.isTrue(await gunther.issueCommand('/house settings'));
            assert.isTrue(gunther.lastDialog.includes(testCase.text));
        }
    });
});
