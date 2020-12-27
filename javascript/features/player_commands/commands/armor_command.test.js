// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('ArmorCommand', (it, beforeEach) => {
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

    it('should enable administrators to change player armor values', async (assert) => {
        // (1) Russell, as an admin, is able to change their own armour.
        assert.isTrue(await russell.issueCommand('/my armor 75'));

        assert.equal(russell.messages.length, 2);
        assert.includes(
            russell.messages[0],
            Message.format(Message.PLAYER_COMMANDS_ARMOR_UPDATED_SELF_ADMIN, russell.name,
                           russell.id, 75));

        assert.equal(
            russell.messages[1], Message.format(Message.PLAYER_COMMANDS_ARMOR_UPDATED_SELF, 75));

        assert.equal(russell.armour, 75);

        // (2) Russell, as an admin, is able to change other player's armour values.
        assert.isTrue(await russell.issueCommand('/p gunt armor 65'));

        assert.equal(russell.messages.length, 4);
        assert.includes(
            russell.messages[2],
            Message.format(Message.PLAYER_COMMANDS_ARMOR_UPDATED_OTHER_ADMIN, russell.name,
                           russell.id, gunther.name, gunther.id, gunther.armour));

        assert.equal(
            russell.messages[3],
            Message.format(Message.PLAYER_COMMANDS_ARMOR_UPDATED_OTHER, gunther.name, gunther.id,
                           gunther.armour));

        assert.equal(gunther.armour, 65);

        // (3) It should be possible for Russell to see a player's current armour level.
        assert.isTrue(await russell.issueCommand('/p 0 armor'));

        assert.equal(russell.messages.length, 5);
        assert.equal(
            russell.messages[4],
            Message.format(Message.PLAYER_COMMANDS_ARMOR_STATUS_OTHER, gunther.name, gunther.id,
                           gunther.armour));
    });
});
