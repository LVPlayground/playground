import SpawnArmour from 'features/spawn_armour/spawn_armour.js';	 
import { SpawnArmourManager } from 'features/spawn_armour/spawn_armour_manager.js';

describe('DeathMatchManager', (it, beforeEach) => {
    let manager = null;

    beforeEach(async => {
        server.featureManager.loadFeature('spawn_armour');

        const spawnArmour = server.featureManager.getFeatureForTests('spawn_armour');
        manager = spawnArmour.manager_;
    });

    
    it('should add player spawn armour on spawn', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        assert.equal(gunther.syncedData.spawnArmour, false);

        await gunther.identify();

        manager.onPlayerSpawn(gunther);

        assert.equal(manager.playersWithSpawnArmour_.size, 1);
        assert.equal(gunther.syncedData.spawnArmour, true);
    });

    it('should remove player spawn armour after 11 seconds', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        
        assert.equal(gunther.syncedData.spawnArmour, false);
        
        await gunther.identify();

        manager.onPlayerSpawn(gunther);

        assert.equal(gunther.syncedData.spawnArmour, true);
        await server.clock.advance(11000);

        assert.equal(manager.playersWithSpawnArmour_.size, 0);
        assert.equal(gunther.syncedData.spawnArmour, false);
    });

    it('should announce warning upon player death', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(/* Russell= */ 1);
        russell.level = Player.LEVEL_ADMINISTRATOR;

        await gunther.identify();
        await russell.identify();
        
        manager.onPlayerSpawn(russell);
        gunther.die(russell);

        
        assert.includes(
            russell.messages[1], Message.SPAWN_ARMOUR_PLAYER_KILLED);
        assert.includes(
            russell.messages[2],
            Message.format(Message.SPAWN_ARMOUR_PLAYER_KILLED_NOTIFY, gunther.name,
                           russell.name, russell.name));
    });
});