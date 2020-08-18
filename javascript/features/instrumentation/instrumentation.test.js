// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('Instrumentation', (it, beforeEach) => {
    let database = null;
    let gunther = null;
    let russell = null;

    beforeEach(async () => {
        const feature = server.featureManager.loadFeature('instrumentation');

        database = feature.database_;
        gunther = server.playerManager.getById(/* Gunther= */ 0);
        russell = server.playerManager.getById(/* Russell= */ 1);

        russell.level = Player.LEVEL_ADMINISTRATOR;

        await russell.identify({ userId: 13 });
    });

    it('should be able to log command executions', async (assert) => {
        server.featureManager.loadFeature('communication_commands');

        // (1) Successful sub-command.
        assert.isTrue(await gunther.issueCommand('/pm Russell Hey mate!'));

        assert.equal(database.commands.length, 1);
        assert.strictEqual(database.commands[0].player, gunther);
        assert.equal(database.commands[0].commandName, '/pm');
        assert.isTrue(database.commands[0].commandSuccess);

        // (2) Failed sub-command.
        assert.isFalse(await gunther.issueCommand('/pm CookieMonster y u not her'));

        assert.equal(database.commands.length, 2);
        assert.strictEqual(database.commands[1].player, gunther);
        assert.equal(database.commands[1].commandName, '/pm');
        assert.isFalse(database.commands[1].commandSuccess);

        // (3) Successful main command.
        assert.isTrue(await russell.issueCommand('/ignored Gunther'));

        assert.equal(database.commands.length, 3);
        assert.strictEqual(database.commands[2].player, russell);
        assert.equal(database.commands[2].commandName, '/ignored [target]');
        assert.isTrue(database.commands[2].commandSuccess);

        // (4) Failed main command.
        assert.isFalse(await russell.issueCommand('/cookiecommand'));

        assert.equal(database.commands.length, 4);
        assert.strictEqual(database.commands[3].player, russell);
        assert.equal(database.commands[3].commandName, '/cookiecommand');
        assert.isFalse(database.commands[3].commandSuccess);

        // (5) Ignored failed main command. (Exists in Pawn.)
        assert.isFalse(await russell.issueCommand('/gotogtamv'));

        assert.equal(database.commands.length, 4);
    });
});
