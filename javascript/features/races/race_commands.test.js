// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('RaceCommands', (it, beforeEach) => {
    let gunther = null;

    beforeEach(() => {
        server.featureManager.loadFeature('races');

        gunther = server.playerManager.getById(/* Gunther= */ 0);
    });

    it('should be able to list all available races', async (assert) => {
        await gunther.identify();

        gunther.respondToDialog({ response: 0 /* dismiss */ });

        assert.isTrue(await gunther.issueCommand('/race'));

        // Verify that the race names are included in the dialog.
        assert.includes(gunther.lastDialog, 'Coastal Conduit');
        assert.includes(gunther.lastDialog, 'Los Santos Blown Bikes');

        // Verify that global high scores are included.
        assert.includes(gunther.lastDialog, '02:03 (Badeend)');
        assert.includes(gunther.lastDialog, '03:54 (Lithirm)');

        // Verify that personal high scores are included.
        assert.includes(gunther.lastDialog, '02:08');
    });

    it.fails();
});
