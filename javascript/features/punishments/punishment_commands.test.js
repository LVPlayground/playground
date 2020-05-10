// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.
// @ts-check

describe('PunishmentCommands', (it, beforeEach) => {
    let commands = null;
    let database = null;
    let gunther = null;

    beforeEach(() => {
        const feature = server.featureManager.loadFeature('punishments');

        commands = feature.commands_;
        database = feature.database_;

        gunther = server.playerManager.getById(/* Gunther= */ 0);
        gunther.identify();
    });

    it('should be able to display the most recent bans on the server', async (assert) => {
        assert.isTrue(await gunther.issueCommand('/lastbans'));
        assert.equal(gunther.messages.length, 1);
        assert.includes(gunther.messages[0], 'Sorry, this command is only available');

        gunther.level = Player.LEVEL_ADMINISTRATOR;

        gunther.respondToDialog({ response: 0 /* Dismiss */ });

        assert.isTrue(await gunther.issueCommand('/lastbans'));
        assert.equal(gunther.lastDialogTitle, 'Punishment management');

        const result = gunther.getLastDialogAsTable();
        assert.equal(result.rows.length, 3);
        assert.deepEqual(result.rows, [
            [
                'April 28, 2020 at 8:41 PM',
                'Halo',
                '[CP]Mr.JT',
                'being so thorough',
            ],
            [
                'April 27, 2020 at 2:55 PM',
                '[BB]Joe',
                'slein',
                'Health cheat',
            ],
            [
                'April 26, 2020 at 4:31 AM',
                'Xanland',
                'HaloLVP',
                'Testing serial information',
            ],
        ]);
    });
});
