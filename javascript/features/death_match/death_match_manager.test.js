// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import AbuseConstants from 'features/abuse/abuse_constants.js';
import DeathMatch from 'features/death_match/death_match.js';
import { DeathMatchStats, DeathMatchTeamScore } from 'features/death_match/death_match_stats.js';

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

    it('should show message for player if using invalid dm zone', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        manager.goToDmZone(gunther, 0);

        assert.equal(gunther.messages.length, 2);
        assert.includes(gunther.messages[0], Message.format(Message.DEATH_MATCH_INVALID_ZONE, 0));
        assert.includes(gunther.messages[1], Message.format(Message.DEATH_MATCH_AVAILABLE_ZONES,
            manager.validDmZones().join(', ')));
    });

    it('should not enable players to go to a DM zone when they might abuse it', async (assert) => {
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

    it('should not allow players to go to a death match if they are in another activity', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.activity = Player.PLAYER_ACTIVITY_JS_RACE;

        manager.goToDmZone(gunther, 1);

        assert.equal(gunther.messages.length, 1);
        assert.equal(
            gunther.messages[0],
            Message.format(Message.DEATH_MATCH_TELEPORT_BLOCKED, "you are in another activity."));
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

        manager.playersInDeathMatch_.set(gunther.id, 1);

        manager.leave(gunther);

        assert.equal(gunther.messages.length, 2);
        assert.equal(manager.playersInDeathMatch_.size, 0);
    });

    it('should let player leave death match', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const guntherStats = new DeathMatchStats();
        guntherStats.kills++;
        guntherStats.kills++;
        guntherStats.deaths++;
        guntherStats.damage += 100;
        guntherStats.damage += 50;
        guntherStats.bulletsHit++;
        guntherStats.bulletsMissed++;

        gunther.identify({ userId: 42 });
        manager.playersInDeathMatch_.set(gunther.id, 1);
        manager.playerStats_.set(gunther.id, guntherStats)

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
        manager.playersInDeathMatch_.set(gunther.id, zone);
        manager.playerTeam_.set(gunther.id, 0);
        manager.teamScore_.set(zone, teamScore);
        gunther.team = 1;

        manager.leave(gunther);

        assert.equal(gunther.team, Player.NO_TEAM);
        assert.equal(manager.teamScore_.get(zone).blueTeamKills, 0);
        assert.isFalse(manager.playerTeam_.has(gunther.id));
    });

    it('should set players in team with least members', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);
        const lucy = server.playerManager.getById(2 /* Lucy */);

        manager.setPlayerTeam(gunther, 6);
        manager.setPlayerTeam(russell, 6);

        assert.equal(manager.playerTeam_.get(gunther.id).team, 0);
        assert.equal(manager.playerTeam_.get(russell.id).team, 1);

        manager.playerTeam_.delete(gunther.id);
        manager.setPlayerTeam(gunther, 6);
        manager.setPlayerTeam(lucy, 6);

        assert.equal(manager.playerTeam_.get(gunther.id).team, 0);
        assert.equal(manager.playerTeam_.get(lucy.id).team, 0);

    });

    it('should not show stats if player hasn\'t done a death match', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        manager.showStats(gunther);

        assert.equal(gunther.messages.length, 1);
        assert.includes(gunther.messages[0], Message.DEATH_MATCH_NO_STATS);
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
        manager.playersInDeathMatch_.set(gunther.id, 1);

        manager.onPlayerSpawn({ playerid: gunther.id });

        assert.equal(gunther.health, 100);
    });

    it('should set player team if players spawn in team', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        gunther.activity = Player.PLAYER_ACTIVITY_JS_DM_ZONE;
        manager.playersInDeathMatch_.set(gunther.id, 6);
        manager.playerTeam_.set(gunther.id, { zone: 6, team: 0 });
        
        manager.onPlayerSpawn({ playerid: gunther.id });

        assert.equal(gunther.color, Color.RED);
        assert.equal(gunther.team, 0);
    });

    it('should add a kill to player team', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        manager.playersInDeathMatch_.set(gunther.id, 6);
        manager.playerTeam_.set(gunther.id, { zone: 6, team: 0 });
        const teamScore = new DeathMatchTeamScore();
        
        manager.teamScore_.set(6, teamScore);

        manager.addKillToTeamForPlayer(gunther);

        assert.equal(teamScore.redTeamKills, 1);
        assert.equal(teamScore.blueTeamKills, 0);
        
        manager.playerTeam_.set(gunther.id, { zone: 6, team: 1 });
        
        assert.equal(teamScore.redTeamKills, 1);
        assert.equal(teamScore.blueTeamKills, 1);
    });

    it('should remove player if he disconnects', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        gunther.identify();
        manager.playersInDeathMatch_.set(gunther.id, 1);

        manager.onPlayerDisconnect({ playerid: gunther.id });

        assert.equal(manager.playersInDeathMatch_.has(gunther.id), false);
    });

    it('should not register damage if player not in DM', async (assert) => {
        const issuerId = 11;
        const gunther = server.playerManager.getById(0 /* Gunther */);
        await gunther.identify();

        const stats = new DeathMatchStats();
        manager.playerStats_.set(issuerId, stats);

        manager.onPlayerTakeDamage({ playerid: gunther.id, issuerid: issuerId, amount: 111 });

        assert.equal(stats.damage, 0);
    });

    it('should not register damage if issuer not in DM', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);
        await gunther.identify();
        await russell.identify();

        const stats = new DeathMatchStats();
        manager.playerStats_.set(russell.id, stats);
        manager.playersInDeathMatch_.set(gunther.id, 1);

        manager.onPlayerTakeDamage({ playerid: gunther.id, issuerid: russell.id, amount: 111 });

        assert.equal(stats.damage, 0);
    });

    it('should not register damage if amount is NaN', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);
        await gunther.identify();
        await russell.identify();

        const stats = new DeathMatchStats();
        manager.playerStats_.set(russell.id, stats);
        manager.playersInDeathMatch_.set(gunther.id, 1);
        manager.playersInDeathMatch_.set(russell.id, 1);

        manager.onPlayerTakeDamage({ playerid: gunther.id, issuerid: russell.id, amount: 'Reggie' });

        assert.equal(stats.damage, 0);
    });

    it('should register damage if amount is a valid value', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);
        await gunther.identify();
        await russell.identify();

        const stats = new DeathMatchStats();
        manager.playerStats_.set(russell.id, stats);
        manager.playersInDeathMatch_.set(gunther.id, 1);
        manager.playersInDeathMatch_.set(russell.id, 1);

        manager.onPlayerTakeDamage({ playerid: gunther.id, issuerid: russell.id, amount: 111 });

        assert.equal(stats.damage, 111);
    });

    it('should not register shot if player not in DM', async (assert) => {
        const issuerId = 11;
        const gunther = server.playerManager.getById(0 /* Gunther */);
        await gunther.identify();

        const stats = new DeathMatchStats();
        manager.playerStats_.set(issuerId, stats);

        manager.onPlayerWeaponShot({ playerid: gunther.id, hittype: 1 });

        assert.equal(stats.bulletsHit, 0);
        assert.equal(stats.bulletsMissed, 0);
    });

    it('should register hit if player in DM and lands a shot', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        await gunther.identify();

        const stats = new DeathMatchStats();
        manager.playerStats_.set(gunther.id, stats);
        manager.playersInDeathMatch_.set(gunther.id, 1);

        manager.onPlayerWeaponShot({ playerid: gunther.id, hittype: 1 });

        assert.equal(stats.bulletsHit, 1);
        assert.equal(stats.bulletsMissed, 0);

        manager.onPlayerWeaponShot({ playerid: gunther.id, hittype: 2 });

        assert.equal(stats.bulletsHit, 2);
        assert.equal(stats.bulletsMissed, 0);
    });

    it('should register miss if player in DM and misses a shot', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        await gunther.identify();

        const stats = new DeathMatchStats();
        manager.playerStats_.set(gunther.id, stats);
        manager.playersInDeathMatch_.set(gunther.id, 1);

        manager.onPlayerWeaponShot({ playerid: gunther.id, hittype: 0 });

        assert.equal(stats.bulletsHit, 0);
        assert.equal(stats.bulletsMissed, 1);

        manager.onPlayerWeaponShot({ playerid: gunther.id, hittype: 3 });

        assert.equal(stats.bulletsHit, 0);
        assert.equal(stats.bulletsMissed, 2);
    });

    it('should not do anything upon death if player is not in DM', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);
        await gunther.identify();
        await russell.identify();
        russell.health = 90;

        const guntherStats = new DeathMatchStats();
        const russellStats = new DeathMatchStats();
        manager.playerStats_.set(gunther.id, guntherStats);
        manager.playerStats_.set(russell.id, russellStats);

        manager.onPlayerDeath({ playerid: gunther.id, kllerid: russell.id });

        assert.equal(guntherStats.deaths, 0);
        assert.equal(russellStats.kills, 0);
        assert.equal(russell.health, 90);
    });

    it('should not do anything upon death if killer is not in DM', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);
        await gunther.identify();
        await russell.identify();
        russell.health = 90;

        const guntherStats = new DeathMatchStats();
        const russellStats = new DeathMatchStats();
        manager.playerStats_.set(gunther.id, guntherStats);
        manager.playerStats_.set(russell.id, russellStats);
        manager.playersInDeathMatch_.set(gunther.id, 1);

        manager.onPlayerDeath({ playerid: gunther.id, kllerid: russell.id });

        assert.equal(guntherStats.deaths, 0);
        assert.equal(russellStats.kills, 0);
        assert.equal(russell.health, 90);
    });

    it('should award KD and health upon kill in DM', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);
        await gunther.identify({ userId: 42 });
        await russell.identify({ userId: 11 });
        russell.health = 90;
        russell.armour = 0;

        const guntherStats = new DeathMatchStats();
        const russellStats = new DeathMatchStats();
        manager.playerStats_.set(gunther.id, guntherStats);
        manager.playerStats_.set(russell.id, russellStats);
        manager.playersInDeathMatch_.set(gunther.id, 1);
        manager.playersInDeathMatch_.set(russell.id, 1);

        manager.onPlayerDeath({ playerid: gunther.id, killerid: russell.id });

        assert.equal(guntherStats.deaths, 1);
        assert.equal(russellStats.kills, 1);
        assert.equal(russell.health, 100);
        assert.equal(russell.armour, 90);
    });

    it('should award KD and health upon kill in DM with a limit to 100 hp and armour', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);
        await gunther.identify();
        await russell.identify();
        russell.health = 90;
        russell.armour = 40; // He regenerated armour from properties or such

        const guntherStats = new DeathMatchStats();
        const russellStats = new DeathMatchStats();
        manager.playerStats_.set(gunther.id, guntherStats);
        manager.playerStats_.set(russell.id, russellStats);
        manager.playersInDeathMatch_.set(gunther.id, 1);
        manager.playersInDeathMatch_.set(russell.id, 1);

        manager.onPlayerDeath({ playerid: gunther.id, killerid: russell.id });

        assert.equal(guntherStats.deaths, 1);
        assert.equal(russellStats.kills, 1);
        assert.equal(russell.health, 100);
        assert.equal(russell.armour, 100);
    });
});