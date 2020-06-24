// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import SpawnWeapons from "features/player_commands/commands/spawn_weapons.js";

describe('SpawnWeapons', (it, beforeEach, afterEach) => {
    let command = null;
    let gunther = null;
    let russell = null;
    let finance = null;

    beforeEach(async () => {
        const announce = server.featureManager.loadFeature('announce');
        const limits = server.featureManager.loadFeature('limits');

        finance = server.featureManager.loadFeature('finance');

        command = new SpawnWeapons(() => announce, () => finance, () => limits);

        gunther = server.playerManager.getById(0 /* Gunther */);
        russell = server.playerManager.getById(1 /* Russell */);
        await gunther.identify();
        await russell.identify();
        russell.level = Player.LEVEL_ADMINISTRATOR;
    });

    it('should not allow buying weapons if it might be abuse.', assert => {
        gunther.shoot({ target: russell });

        command.onSpawnWeaponsCommand(gunther, 24, 1);

        assert.equal(gunther.messages.length, 1);
        assert.includes(gunther.messages[0], 'Sorry, you can\'t get weapons now because you');
    });

    it('should not be able to give an invalid spawn weapon.', async assert => {
        command.giveSpawnWeapon(gunther, gunther, 35, 1);

        assert.equal(gunther.messages.length, 1);
        assert.includes(gunther.messages[0], "Sorry, id 35 is not a valid spawn weapon.");
    });

    it('should not be able to use zero as multiplier.', async assert => {
        command.giveSpawnWeapon(gunther, gunther, 24, 0);

        assert.equal(gunther.messages.length, 1);
        assert.includes(gunther.messages[0], "Sorry, you can only have a multiplier of 1-100.");
    });

    it('should not be able to use 101 as multiplier.', async assert => {
        command.giveSpawnWeapon(gunther, gunther, 24, 101);

        assert.equal(gunther.messages.length, 1);
        assert.includes(gunther.messages[0], "Sorry, you can only have a multiplier of 1-100.");
    });

    it('should give error if player does not have enough cash.', async assert => {
        command.giveSpawnWeapon(gunther, gunther, 24, 10);

        assert.equal(gunther.messages.length, 1);
        assert.includes(gunther.messages[0], "Sorry, you need");
    });

    it('should be able to give spawn armour to other player without money.', async assert => {
        command.giveSpawnWeapon(russell, gunther, 1337, 1);

        assert.equal(russell.messages.length, 1);
        assert.includes(russell.messages[0], "the armour has been bought.");
        assert.equal(gunther.messages.length, 0);
    });

    it('should give spawn weapon if everything aligns nicely', async assert => {
        finance.givePlayerCash(gunther, 1000000);

        command.onSpawnWeaponsCommand(gunther, 24, 1);

        assert.equal(gunther.messages.length, 1);
        assert.includes(gunther.messages[0], "Desert Eagle with ammo multiplier '1' has been bought.");
    });

});
