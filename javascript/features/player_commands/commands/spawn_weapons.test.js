// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('SpawnWeapons', (it, beforeEach) => {
    let finance = null;
    let gunther = null;
    let russell = null;

    beforeEach(async () => {
        const feature = server.featureManager.loadFeature('player_commands');

        finance = server.featureManager.loadFeature('finance');
        gunther = server.playerManager.getById(/* Gunther= */ 0);
        russell = server.playerManager.getById(/* Russell= */ 1);
        russell.level = Player.LEVEL_ADMINISTRATOR;

        await feature.registry_.initialize();
        await russell.identify();
    });

    it('should not allow buying weapons if it might be abuse', async (assert) => {
        gunther.shoot({ target: russell });

        assert.isTrue(await gunther.issueCommand('/my spawnweapons 24 1'));

        assert.equal(gunther.messages.length, 1);
        assert.includes(gunther.messages[0], `Sorry, you can't get weapons now because you`);
    });

    it('should not be able to give an invalid spawn weapon', async (assert) => {
        assert.isTrue(await gunther.issueCommand('/my spawnweapons 35'));

        assert.equal(gunther.messages.length, 1);
        assert.includes(gunther.messages[0], 'Sorry, id 35 is not a valid spawn weapon.');
    });

    it('should not be able to use zero as multiplier', async (assert) => {
        assert.isTrue(await gunther.issueCommand('/my spawnweapons 24 0'));

        assert.equal(gunther.messages.length, 1);
        assert.includes(gunther.messages[0], 'Sorry, you can only have a multiplier of 1-100.');

        assert.isTrue(await gunther.issueCommand('/my spawnweapons 24 101'));

        assert.equal(gunther.messages.length, 2);
        assert.includes(gunther.messages[1], 'Sorry, you can only have a multiplier of 1-100.');
    });

    it('should give error if player does not have enough cash', async (assert) => {
        assert.isTrue(await gunther.issueCommand('/my spawnweapons 24'));

        assert.equal(gunther.messages.length, 1);
        assert.includes(gunther.messages[0], 'Sorry, you need');
    });

    it('should be able to give spawn armour to other player without money.', async assert => {
        assert.isTrue(await russell.issueCommand('/p gunther spawnweapons 1337'));

        assert.equal(russell.messages.length, 1);
        assert.equal(
            russell.messages[0], Message.format(Message.PLAYER_COMMANDS_SPAWN_WEAPONS_ARMOUR));

        assert.equal(gunther.messages.length, 0);
    });

    it('should give spawn weapon if everything aligns nicely', async (assert) => {
        finance.givePlayerCash(gunther, 1000000);

        assert.isTrue(await gunther.issueCommand('/my spawnweapons 24'));

        assert.equal(gunther.messages.length, 1);
        assert.includes(
            gunther.messages[0], `Desert Eagle with ammo multiplier '1' has been bought.`);
    });
});
