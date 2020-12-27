// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('FreezeCommand', (it, beforeEach) => {
    let gunther = null;
    let russell = null;

    beforeEach(async () => {
        const feature = server.featureManager.loadFeature('player_commands');

        gunther = server.playerManager.getById(/* Gunther= */ 0);
        russell = server.playerManager.getById(/* Russell= */ 1);
        russell.level = Player.LEVEL_ADMINISTRATOR;

        await feature.registry_.initialize();
        await russell.identify();
    });

    it('should enable administrators to freeze and unfreeze players', async (assert) => {
        assert.isTrue(gunther.controllableForTesting);
        assert.isTrue(russell.controllableForTesting);

        // (1) Russell has the ability to freeze Gunther.
        assert.isTrue(await russell.issueCommand('/p gunt freeze'));
        assert.isFalse(gunther.controllableForTesting);

        assert.equal(russell.messages.length, 2);
        assert.includes(
            russell.messages[0],
            Message.format(Message.PLAYER_COMMANDS_FREEZE_OTHER_ADMIN, russell.name, russell.id,
                           gunther.name, gunther.id));

        assert.equal(
            russell.messages[1],
            Message.format(Message.PLAYER_COMMANDS_FREEZE_OTHER, gunther.name, gunther.id));

        assert.equal(gunther.messages.length, 1);
        assert.equal(
            gunther.messages[0],
            Message.format(Message.PLAYER_COMMANDS_FREEZE_FYI, russell.name, russell.id));

        // (2) Russell has the ability to unfreeze Gunther.
        assert.isTrue(await russell.issueCommand('/p gunt unfreeze'));
        assert.isTrue(gunther.controllableForTesting);

        assert.equal(russell.messages.length, 4);
        assert.includes(
            russell.messages[2],
            Message.format(Message.PLAYER_COMMANDS_UNFREEZE_OTHER_ADMIN, russell.name, russell.id,
                           gunther.name, gunther.id));

        assert.equal(
            russell.messages[3],
            Message.format(Message.PLAYER_COMMANDS_UNFREEZE_OTHER, gunther.name, gunther.id));

        assert.equal(gunther.messages.length, 2);
        assert.equal(
            gunther.messages[1],
            Message.format(Message.PLAYER_COMMANDS_UNFREEZE_FYI, russell.name, russell.id));

        // (3) Russell has the ability to freeze and unfreeze themselves.
        assert.isTrue(await russell.issueCommand('/my freeze'));
        assert.isFalse(russell.controllableForTesting);

        assert.equal(russell.messages.length, 6);
        assert.includes(
            russell.messages[4],
            Message.format(Message.PLAYER_COMMANDS_FREEZE_SELF_ADMIN, russell.name, russell.id));

        assert.equal(russell.messages[5], Message.PLAYER_COMMANDS_FREEZE_SELF);

        assert.isTrue(await russell.issueCommand('/my unfreeze'));
        assert.isTrue(russell.controllableForTesting);

        assert.equal(russell.messages.length, 8);
        assert.includes(
            russell.messages[6],
            Message.format(Message.PLAYER_COMMANDS_UNFREEZE_SELF_ADMIN, russell.name, russell.id));

        assert.equal(russell.messages[7], Message.PLAYER_COMMANDS_UNFREEZE_SELF);
    });
});
