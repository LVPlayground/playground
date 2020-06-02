// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CollectableDatabase } from 'features/collectables/collectable_database.js';
import { Vector } from 'base/vector.js';

describe('CollectableCommands', (it, beforeEach) => {
    let commands = null;
    let gunther = null;
    let manager = null;

    beforeEach(async () => {
        const feature = server.featureManager.loadFeature('collectables');
        feature.manager_.initialize();  // load all data from disk

        commands = feature.commands_;
        gunther = server.playerManager.getById(/* Gunther= */ 0);
        manager = feature.manager_;

        await gunther.identify();
    });

    it('should be able to display progress on each of the collectables', async (assert) => {
        gunther.respondToDialog({ response: 0 /* Dismiss */ });

        assert.isTrue(await gunther.issueCommand('/collectables'));
        assert.deepEqual(gunther.getLastDialogAsTable(), {
            columns: [ 'Series', 'Progress' ],
            rows: [
                [
                    'Achievements',
                    '{CCCCCC}not started',
                ],
                [
                    '{FF5252}Red Barrels',
                    '6 / 100',
                ],
                [
                    '{B2FF59}Spray Tags',
                    '2 / 100',
                ],
            ]
        });
    });

    it('should enable players to read the instructions for a series', async (assert) => {
        gunther.respondToDialog({ listitem: 1 /* Red Barrels */ }).then(
            () => gunther.respondToDialog({ listitem: 0 /* Instructions */ })).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/collectables'));
        assert.includes(gunther.lastDialog, 'Red Barrels');

        gunther.respondToDialog({ listitem: 2 /* Spray Tags */ }).then(
            () => gunther.respondToDialog({ listitem: 0 /* Instructions */ })).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/collectables'));
        assert.includes(gunther.lastDialog, 'Spray Tags');
    });

    it('should enable players to purchase a hint for the closest collectable', async (assert) => {
        const finance = server.featureManager.loadFeature('finance');

        assert.equal(finance.getPlayerCash(gunther), 0);

        // (1) The player doesn't have enough money.
        gunther.respondToDialog({ listitem: 1 /* Red Barrels */ }).then(
            () => gunther.respondToDialog({ listitem: 1 /* Purchase a hint */ })).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));
    
        assert.isTrue(await gunther.issueCommand('/collectables'));
        assert.includes(gunther.lastDialog, 'to pay for');
        assert.equal(gunther.messages.length, 0);

        finance.givePlayerCash(gunther, 25000000);

        // (2) The player is able to purchase the hint successfully.
        gunther.respondToDialog({ listitem: 1 /* Red Barrels */ }).then(
            () => gunther.respondToDialog({ listitem: 1 /* Purchase a hint */ })).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));
    
        assert.isTrue(await gunther.issueCommand('/collectables'));
        assert.doesNotInclude(gunther.lastDialog, 'to pay for');
        assert.equal(gunther.messages.length, 1);

        assert.isBelow(finance.getPlayerCash(gunther), 25000000);
    });

    it('should enable players to reset collectables of a particular type', async (assert) => {
        const delegate = manager.getDelegate(CollectableDatabase.kRedBarrel);
        const current = delegate.countCollectablesForPlayer(gunther).round;

        assert.isBelow(current, delegate.getCollectableCount());
        
        // Blow up all the red barrels in existence for the |player|, to make sure that they've got
        // a perfect ratio, which unlocks the reset option in this menu dialog.
        for (let barrel = current; barrel < delegate.getCollectableCount(); ++barrel) {
            const barrel = [ ...delegate.playerBarrels_.get(gunther).keys() ].shift();
            server.objectManager.onPlayerShootObject({
                playerid: gunther.id,
                objectid: barrel.id,
            });
        }

        assert.equal(
            delegate.countCollectablesForPlayer(gunther).total, delegate.getCollectableCount());
        assert.equal(
            delegate.countCollectablesForPlayer(gunther).round, delegate.getCollectableCount());

        // Now reset all the Red Barrels for poor old Gunther.
        gunther.respondToDialog({ listitem: 1 /* Red Barrels */ }).then(
            () => gunther.respondToDialog({ listitem: 1 /* Reset the Red Barrels */ })).then(
            () => gunther.respondToDialog({ response: 1 /* Confirm */ })).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));
        
        assert.isTrue(await gunther.issueCommand('/collectables'));

        assert.equal(
            delegate.countCollectablesForPlayer(gunther).total, delegate.getCollectableCount());
        assert.equal(delegate.countCollectablesForPlayer(gunther).round, 0);
    });

    it('is able to calculate the price of a hint based on conditionals', assert => {
        const settings = server.featureManager.loadFeature('settings');

        settings.setValue('playground/collectable_hint_price_min',   10);
        settings.setValue('playground/collectable_hint_price_max', 1000);

        const expectations = [
        //    Progression | Nearby (250m) | City-ish (1000m) | Island (2500m)
            [ 0.00,           9.9,            9.6,               8.9 ],
            [ 0.25,         102.4,           99.3,              92.4 ],
            [ 0.50,         411.8,          399.3,             371.3 ],
            [ 0.90,         964.4,          935.2,             869.6 ],
            [ 1.00,         992.5,          962.5,             895.0 ],
        ];

        // Calculate the distances from |gunther| to each of the predefined distances.
        const nearbyPosition = gunther.position.translateTo2D(250, 0);
        const cityPosition = gunther.position.translateTo2D(1000, 0);
        const islandPosition = gunther.position.translateTo2D(2500, 0);

        for (const [ ratio, nearbyPrice, cityPrice, islandPrice ] of expectations) {
            assert.setContext(ratio);

            assert.closeTo(
                commands.calculatePriceForHint(gunther.position, nearbyPosition, ratio),
                nearbyPrice, 1);

            assert.closeTo(
                commands.calculatePriceForHint(gunther.position, cityPosition, ratio),
                cityPrice, 1);

            assert.closeTo(
                commands.calculatePriceForHint(gunther.position, islandPosition, ratio),
                islandPrice, 1);
        }

        // Appendix: it can calculate directions too.
        assert.equal(commands.determineDirection(gunther.position, new Vector(0, 50, 0)), 'north');
        assert.equal(commands.determineDirection(gunther.position, new Vector(50, 0, 0)), 'east');
        assert.equal(commands.determineDirection(gunther.position, new Vector(0, -50, 0)), 'south');
        assert.equal(commands.determineDirection(gunther.position, new Vector(-50, 0, 0)), 'west');
    });
});
