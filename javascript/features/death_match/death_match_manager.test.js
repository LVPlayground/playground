// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import AbuseConstants from 'features/abuse/abuse_constants.js';
import DeathMatch from 'features/death_match/death_match.js';

describe('DeathMatchManager', (it, beforeEach) => {
    let manager = null;

    beforeEach(async => {        
        server.featureManager.registerFeaturesForTests({
            death_match: DeathMatch
        });

        server.featureManager.loadFeature('death_match');

        const deathMatch = server.featureManager.getFeatureForTests('death_match');
        manager = deathMatch.manager_;
    });

    it('should show message for player if using invalid dm zone', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        manager.goToDmZone(gunther, 0);

        assert.equal(gunther.messages.length, 2);
        assert.includes(gunther.messages[0], Message.format(Message.DEATH_MATCH_INVALID_ZONE, 0));
        assert.includes(gunther.messages[1],  Message.format(Message.DEATH_MATCH_AVAILABLE_ZONES,
            manager.validDmZones().join(', ')));
    });

    it('should not enable players to go to a DM zone when they might abuse it', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);

        gunther.identify({ userId: 42 });
        gunther.shoot({ target: russell });

        manager.goToDmZone(gunther, 1);

        assert.equal(gunther.messages.length, 1);
        assert.equal(
            gunther.messages[0],
            Message.format(Message.DEATH_MATCH_TELEPORT_BLOCKED,
                           AbuseConstants.REASON_FIRED_WEAPON));
    });

    it('should set player settings if going to dm zone', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        manager.goToDmZone(gunther, 1);
        
        assert.equal(gunther.activity, Player.PLAYER_ACTIVITY_JS_DM_ZONE);
        assert.equal(gunther.health, 100);
        assert.equal(gunther.armour, 100);
    });

    it('should not do leave command if player is not in death match', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);

        gunther.identify({ userId: 42 });
        gunther.shoot({ target: russell });
        
        assert.equal(manager.playersInDeathMatch_.size, 0);   
        manager.leave(gunther);

        assert.equal(gunther.messages.length, 0);
        assert.equal(manager.playersInDeathMatch_.size, 0);        
    });

    it('should kill player upon leave if player recently shot.', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);

        gunther.identify({ userId: 42 });
        manager.playersInDeathMatch_.set(gunther.id, 1);

        gunther.shoot({ target: russell });

        manager.leave(gunther);

        assert.equal(gunther.messages.length, 1);
        assert.equal(manager.playersInDeathMatch_.size, 0);        
    });

    it('should let player leave death match', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        
        gunther.identify({ userId: 42 });
        manager.playersInDeathMatch_.set(gunther.id, 1);

        manager.leave(gunther);

        assert.equal(gunther.messages.length, 0);
        assert.equal(manager.playersInDeathMatch_.size, 0);        
    });

    it('should let player leave death match', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        
        gunther.identify({ userId: 42 });
        manager.playersInDeathMatch_.set(gunther.id, 1);

        manager.leave(gunther);

        assert.equal(gunther.messages.length, 0);
        assert.equal(manager.playersInDeathMatch_.size, 0);        
    });

    it('should not do death match spawn if player not in death match', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        
        gunther.identify({ userId: 42 });
        gunther.health = 99;
        
        manager.onPlayerSpawn({ playerid : gunther.id });

        assert.equal(gunther.health, 99);       
    });

    it('should do death match spawn if player in death match', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        
        gunther.identify({ userId: 42 });
        gunther.health = 99;

        manager.playersInDeathMatch_.set(gunther.id, 1);
        
        manager.onPlayerSpawn({ playerid : gunther.id });

        assert.equal(gunther.health, 100);       
    });

    it('should remove player if he disconnects', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        
        gunther.identify({ userId: 42 });
        manager.playersInDeathMatch_.set(gunther.id,  1);
        
        manager.onPlayerDisconnect({ playerid : gunther.id });

        assert.equal(manager.playersInDeathMatch_.has(gunther.id), false);     
    });
});