// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('CollectableCommands', (it, beforeEach) => {
    let gunther = null;
    let manager = null;

    beforeEach(async () => {
        const feature = server.featureManager.loadFeature('collectables');
        feature.manager_.initialize();  // load all data from disk

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
});
