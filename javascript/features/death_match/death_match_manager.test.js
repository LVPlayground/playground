// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import DeathMatch from 'features/death_match/death_match.js';	 
import { DeathMatchTeamScore, DeathMatchManger } from 'features/death_match/death_match_manager.js';
import { TextDraw } from 'components/text_draw/text_draw.js';

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

    it('should set player settings if going to dm zone', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        manager.goToDmZone(gunther, 1);

        assert.equal(gunther.activity, Player.PLAYER_ACTIVITY_JS_DM_ZONE);
        assert.equal(gunther.health, 100);
        assert.equal(gunther.armour, 100);
    });

    it('should not do leave command if player is not in death match', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        gunther.identify({ userId: 42 });

        assert.equal(manager.playersInDeathMatch_.size, 0);
        manager.leave(gunther);

        assert.equal(gunther.messages.length, 0);
        assert.equal(manager.playersInDeathMatch_.size, 0);
    });

    it('should kill player upon leave if player recently shot.', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);

        gunther.identify({ userId: 42 });
        gunther.shoot({ target: russell });

        manager.playersInDeathMatch_.set(gunther, 1);

        manager.leave(gunther);

        assert.equal(gunther.messages.length, 1);
        assert.equal(manager.playersInDeathMatch_.size, 0);
    });

    it('should let player leave death match', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const snapshot = gunther.stats.snapshot();

        gunther.stats.session.killCount = 2;
        gunther.stats.session.deathCount = 1;
        gunther.stats.session.damageGiven = 150;
        gunther.stats.session.shotsHit = 1;
        gunther.stats.session.shotsMissed = 1;

        gunther.identify({ userId: 42 });
        manager.playersInDeathMatch_.set(gunther, 1);
        manager.playerStats_.set(gunther, snapshot)

        manager.leave(gunther);

        assert.equal(manager.playersInDeathMatch_.size, 0);
        assert.equal(gunther.messages.length, 3);
        assert.equal(
            gunther.messages[1],
            Message.format(Message.DEATH_MATCH_KILL_DEATH, 2, 1, 2.00));

        assert.equal(
            gunther.messages[2],
            Message.format(Message.DEATH_MATCH_DAMAGE_ACCURACY, 150, 50));
    });

    it('should reset team stats if player leaves', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const teamScore = new DeathMatchTeamScore();
        teamScore.blueTeamKills++;
        const zone = 1;

        gunther.identify({ userId: 42 });
        manager.playersInDeathMatch_.set(gunther, zone);
        manager.playerTeam_.set(gunther, 0);
        manager.teamScore_.set(zone, teamScore);
        gunther.team = 1;

        manager.leave(gunther);

        assert.equal(gunther.team, Player.kNoTeam);
        assert.equal(manager.teamScore_.get(zone).blueTeamKills, 0);
        assert.isFalse(manager.playerTeam_.has(gunther.id));
    });

    it('should set players in team with least members', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);
        const lucy = server.playerManager.getById(2 /* Lucy */);

        manager.setPlayerTeam(gunther, 8);
        manager.setPlayerTeam(russell, 8);

        assert.equal(manager.playerTeam_.get(gunther).team, 0);
        assert.equal(manager.playerTeam_.get(russell).team, 1);

        manager.playerTeam_.delete(gunther);
        manager.setPlayerTeam(gunther, 8);
        manager.setPlayerTeam(lucy, 8);

        assert.equal(manager.playerTeam_.get(gunther).team, 0);
        assert.equal(manager.playerTeam_.get(lucy).team, 0);

    }); 

    it('should not do death match spawn if player not in death match', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        gunther.identify();
        gunther.health = 99;

        manager.onPlayerSpawn({ playerid: gunther.id });

        assert.equal(gunther.health, 99);
    });

    it('should do death match spawn if player in death match', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        gunther.identify();
        gunther.health = 99;
        gunther.activity = Player.PLAYER_ACTIVITY_JS_DM_ZONE;
        manager.playersInDeathMatch_.set(gunther, 1);

        gunther.respawn();

        assert.equal(gunther.health, 100);
    });

    it('should set player team if players spawn in team', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        gunther.activity = Player.PLAYER_ACTIVITY_JS_DM_ZONE;
        manager.playersInDeathMatch_.set(gunther, 8);
        manager.playerTeam_.set(gunther, { zone: 8, team: 0 });

        gunther.respawn();

        assert.equal(gunther.team, 0);
    });

    it('should add a kill to player team', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        manager.playersInDeathMatch_.set(gunther, 8);
        manager.playerTeam_.set(gunther, { zone: 8, team: 0 });
        const teamScore = new DeathMatchTeamScore();

        manager.teamScore_.set(8, teamScore);

        manager.addKillToTeamForPlayer(gunther);

        assert.equal(teamScore.redTeamKills, 1);
        assert.equal(teamScore.blueTeamKills, 0);

        manager.playerTeam_.set(gunther, { zone: 8, team: 1 });
        manager.addKillToTeamForPlayer(gunther);

        assert.equal(teamScore.redTeamKills, 1);
        assert.equal(teamScore.blueTeamKills, 1);
    });

    it('should remove player if they disconnect', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        gunther.identify();
        manager.playersInDeathMatch_.set(gunther, 1);

        gunther.disconnectForTesting();

        assert.equal(manager.playersInDeathMatch_.has(gunther), false);
    });

    it('should award KD and health upon kill in DM', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);
        await gunther.identify({ userId: 42 });
        await russell.identify({ userId: 11 });
        russell.health = 90;
        russell.armour = 0;

        manager.playerStats_.set(gunther, gunther.stats.snapshot());
        manager.playerStats_.set(russell, russell.stats.snapshot());
        manager.playersInDeathMatch_.set(gunther, 1);
        manager.playersInDeathMatch_.set(russell, 1);

        gunther.die(russell);

        assert.equal(russell.health, 100);
        assert.equal(russell.armour, 90);
    });

    it('should award KD and health upon kill in DM with a limit to 100 hp and armour', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);
        await gunther.identify();
        await russell.identify();
        russell.health = 90;
        russell.armour = 40; // They regenerated armour from properties or such

        manager.playerStats_.set(gunther, gunther.stats.snapshot());
        manager.playerStats_.set(russell, russell.stats.snapshot());

        manager.playersInDeathMatch_.set(gunther, 1);
        manager.playersInDeathMatch_.set(russell, 1);

        gunther.die(russell);

        assert.equal(russell.health, 100);
        assert.equal(russell.armour, 100);
    });

    it('should enable lag compensation mode to be toggled per zone', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        assert.equal(gunther.syncedData.lagCompensationMode, 2);
        assert.isFalse(manager.playersInDeathMatch_.has(gunther));

        // (1) Teleport to a Lag Shot DM zone.
        manager.goToDmZone(gunther, /* Baseball field RW (lag shot)= */ 7);
        assert.equal(gunther.syncedData.lagCompensationMode, 0);
        assert.equal(manager.playersInDeathMatch_.get(gunther), 7);

        // (2) Leave it.
        manager.leave(gunther);
        assert.equal(gunther.syncedData.lagCompensationMode, 2);
        assert.isFalse(manager.playersInDeathMatch_.has(gunther));

        // (3) Teleport to a Skin Hit DM zone.
        manager.goToDmZone(gunther, /* Baseball field RW (skin hit)= */ 3);
        assert.equal(gunther.syncedData.lagCompensationMode, 2);
        assert.equal(manager.playersInDeathMatch_.get(gunther), 3);

        // (4) Teleport directly to a Lag Shot DM zone.
        manager.goToDmZone(gunther, /* Baseball field RW (lag shot)= */ 7);
        assert.equal(gunther.syncedData.lagCompensationMode, 0);
        assert.equal(manager.playersInDeathMatch_.get(gunther), 7);

        // (5) Leave it.
        manager.leave(gunther);
        assert.equal(gunther.syncedData.lagCompensationMode, 2);
        assert.isFalse(manager.playersInDeathMatch_.has(gunther));
    });

    it('should set lag compensation mode to default if leaving while shot', async (assert) => {        
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);
        gunther.syncedData.lagCompensationMode = 0;
        gunther.shoot({ target: russell });
        
        manager.leave(gunther);

        assert.equal(gunther.syncedData.lagCompensationMode, 2);    
    });

    it('should dispose text draws for players', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);        
        const textDraw = new TextDraw();

        const managerForDisposal = new DeathMatchManger(null, null);
        managerForDisposal.zoneTextDraws_.set(1, textDraw);
        managerForDisposal.playersInDeathMatch_.set(gunther, 1);

        textDraw.displayForPlayer(gunther);
        
        managerForDisposal.dispose();

        assert.equal(server.deprecatedTextDrawManager.getForPlayer(gunther, textDraw), null);
    });

    it('should set gravity upon joining low gravity zone', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const zone = 4;

        manager.goToDmZone(gunther, zone);
        
        assert.equal(gunther.gravity, 0.002);
    });

    it('should restore gravity upon leaving', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const zone = 4;

        gunther.identify({ userId: 42 });
        manager.playersInDeathMatch_.set(gunther, zone);
        gunther.gravity = 0.002;

        manager.leave(gunther);

        assert.equal(gunther.gravity, Player.kDefaultGravity);
    });

    it('should remove the players team if they disconnects', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);
        const zone = 9;

        // (1) Gunther joins and disconnects. Player team should be set to 0.
        manager.goToDmZone(gunther, zone);
        gunther.disconnectForTesting();

        assert.equal(manager.playerTeam_.size, 0);
        assert.equal(gunther.team, Player.kNoTeam);

        // (2) Now Russell joins too. They should be in the first team as Gunther is gone.
        manager.goToDmZone(russell, zone);

        assert.equal(russell.team, 0);
    });

    it('should throw error if getPlayersInZone is called with invalid zone', assert => {
        assert.throws(() => manager.getPlayersInZone(null));
        assert.throws(() => manager.getPlayersInZone(0));
    });

    it('should give 0 players if no player in zone', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        
        manager.goToDmZone(gunther, 2);
        
        const players = manager.getPlayersInZone(1);
        
        assert.equal(players, 0);
    });

    it('should give amount of players no players in zone', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);
        
        manager.goToDmZone(gunther, 1);
        manager.goToDmZone(russell, 1);
        
        const players = manager.getPlayersInZone(1);
        
        assert.equal(players, 2);
    });
});