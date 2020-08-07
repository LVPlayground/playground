// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.
// @ts-check

describe('PunishmentCommands', (it, beforeEach) => {
    let commands = null;
    let database = null;
    let gunther = null;

    beforeEach(async() => {
        const feature = server.featureManager.loadFeature('punishments');

        commands = feature.commands_;
        database = feature.database_;

        gunther = server.playerManager.getById(/* Gunther= */ 0);
        await gunther.identify();
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

    it('should enable administrators to undo one of those bans', async (assert) => {
        gunther.level = Player.LEVEL_ADMINISTRATOR;

        // (1) The administrator needs to confirm that this really is what they want.
        gunther.respondToDialog({ listitem: 1 /* Revoke the ban on [BB]Joe */ }).then(
            () => gunther.respondToDialog({ response: 0 /* Cancel */ }));

        assert.isTrue(await gunther.issueCommand('/lastbans'));
        assert.includes(gunther.lastDialog, 'Are you sure');

        // (2) They must give a reason as to why the ban is being revoked.
        gunther.respondToDialog({ listitem: 1 /* Revoke the ban on [BB]Joe */ }).then(
            () => gunther.respondToDialog({ response: 1 /* Confirm */ })).then(
            () => gunther.respondToDialog({ inputtext: 'none'})).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/lastbans'));
        assert.includes(gunther.lastDialog, 'must be at least');

        // (3) If all conditions are met, the ban will be removed.
        gunther.respondToDialog({ listitem: 1 /* Revoke the ban on [BB]Joe */ }).then(
            () => gunther.respondToDialog({ response: 1 /* Confirm */ })).then(
            () => gunther.respondToDialog({ inputtext: 'reason'})).then(
            () => gunther.respondToDialog({ response: 1 /* Ack */ }));

        assert.isTrue(await gunther.issueCommand('/lastbans'));
        assert.equal(gunther.lastDialog, 'The ban on [BB]Joe has been lifted.');

        // (4) Verify that the ban was lifted, and a note was added to the database.
        assert.isNotNull(database.unbanLogId);
        assert.equal(database.unbanLogId, 2);

        assert.isNotNull(database.addedEntry);
        assert.equal(database.addedEntry.type, 'unban');
        assert.equal(database.addedEntry.sourceUserId, gunther.account.userId);
        assert.equal(database.addedEntry.sourceNickname, gunther.name);
        assert.equal(database.addedEntry.subjectNickname, '[BB]Joe');
        assert.equal(database.addedEntry.note, 'reason');

        // (5) Verify that a message was sent to the administrators.
        assert.equal(gunther.messages.length, 1);
        assert.includes(gunther.messages[0], 
            Message.format(Message.PUNISHMENT_ADMIN_UNBAN, gunther.name, gunther.id,
                           '[BB]Joe', 'reason'));
    });

    it('should be able to run memory scans against a particular player', async (assert) => {
        const russell = server.playerManager.getById(/* Russell= */ 1);

        gunther.level = Player.LEVEL_MANAGEMENT;
        russell.setIsNonPlayerCharacterForTesting(true);

        // (1) It's not possible to start scans for non-player characters.
        assert.isTrue(await gunther.issueCommand('/scan Russell'));
        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.PUNISHMENT_SCAN_ERROR_NPC);

        // (2) Scans should return after a sensible amount of time, and explain that to the player.
        gunther.respondToDialog({ response: 0 /* dismiss */ });

        const [ commandResult, advanceResult ] = await Promise.all([
            gunther.issueCommand('/scan Gunther'),
            Promise.resolve().then(() =>
                server.clock.advance(30 * 1000 /* some excessively long amount of time*/)),
        ]);

        assert.isTrue(commandResult);
        assert.equal(gunther.messages.length, 2);
        assert.equal(
            gunther.messages[1],
            Message.format(Message.PUNISHMENT_SCAN_STARTING, gunther.name, gunther.id));

        assert.includes(gunther.lastDialog, 'SAMPCAC Version');
        assert.includes(gunther.lastDialog, gunther.version);

        // (3) Reload the SAMPCAC configuration to make sure there's no errors.
        assert.isTrue(await gunther.issueCommand('/scan reload'));
        assert.equal(gunther.messages.pop(), Message.PUNISHMENT_SCAN_RELOADED);
    });

    it('should be able to run memory scans on all players', async (assert) => {
        gunther.level = Player.LEVEL_MANAGEMENT;

        // (2) Scans should return after a sensible amount of time, and explain that to the player.
        gunther.respondToDialog({ response: 0 /* dismiss */ });

        const [ commandResult, advanceResult ] = await Promise.all([
            gunther.issueCommand('/scanall'),
            Promise.resolve().then(() =>
                server.clock.advance(30 * 1000 /* some excessively long amount of time*/)),
        ]);

        assert.isTrue(commandResult);
        assert.equal(gunther.messages.length, 1);
        assert.equal(
            gunther.messages[0],
            Message.format(Message.PUNISHMENT_SCAN_ALL_STARTING, server.playerManager.count));

        assert.includes(gunther.lastDialog, '0.3.7-R4-mock');
        assert.includes(gunther.lastDialog, 'Lucy');
    });
});
