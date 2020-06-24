// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { DeathMatchLocation } from 'features/death_match/death_match_location.js';
import { ScopedCallbacks } from 'base/scoped_callbacks.js';
import { TextDraw } from 'components/text_draw/text_draw.js';

const RED_TEAM = 0;
const BLUE_TEAM = 1;

// This class will manage the DeathMatch zones. Allowing the player to join and leave at will.
export class DeathMatchManger {
    lastQuarterUsedLocationsQueue = [];

    constructor(announce, limits) {
        this.announce_ = announce;
        this.limits_ = limits;

        this.playersInDeathMatch_ = new Map();

        // Stats of the player. Will not be cleared upon leaving the death match.
        this.playerStats_ = new Map();
        // Key: player, value: { zone: zone, team: team }
        this.playerTeam_ = new Map();
        // Key: Zone, value: DeathMatchTeamScore
        this.teamScore_ = new Map();

        this.zoneTextDraws_ = new Map();

        this.callbacks_ = new ScopedCallbacks();
        this.callbacks_.addEventListener(
            'playerdeath', DeathMatchManger.prototype.onPlayerDeath.bind(this));

        // Observes the PlayerManager, to be informed of changes in player events.
        // Before e.g. the player has fully disconnected.
        server.playerManager.addObserver(this);
    }

    // The player wants to join the death match.
    goToDmZone(player, zone) {
        const zoneInfo = DeathMatchLocation.getById(zone);
    
        this.restoreDefaultPlayerStatus(player);
    
        player.activity = Player.PLAYER_ACTIVITY_JS_DM_ZONE;
        this.playersInDeathMatch_.set(player, zone);
        this.playerStats_.set(player, player.stats.snapshot());
        this.setPlayerTeam(player, zone);

        const targetLagCompensationMode = zoneInfo.lagShot ? 0 : 2;

        if (player.syncedData.lagCompensationMode !== targetLagCompensationMode)
            player.syncedData.lagCompensationMode = targetLagCompensationMode;

        player.sendMessage(Message.DEATH_MATCH_INSTRUCTION_LEAVE);
        player.sendMessage(Message.DEATH_MATCH_INSTRUCTION_STATS);
        this.announce_().announceToPlayers(Message.DEATH_MATCH_TELEPORTED, player.name, zone);

        player.respawn(); // This will call onPlayerSpawn and spawn the player on the right spot.
    }

    // The player decided to leave so we will make him re-spawn. The player will be killed so that 
    // the person who last hit him will get the kill to avoid abuse.
    leave(player) {
        this.restoreDefaultPlayerStatus(player);

        // To avoid abuse we'll kill the player if they had recently fought.
        const decision = this.limits_().canLeaveDeathmatchZone(player);
        if (!decision.isApproved()) {
            player.sendMessage(Message.DEATH_MATCH_LEAVE_KILLED, decision);
            
            // Manually trigger a death event, because their death should count.
            this.onPlayerDeath({
                playerid: player.id,
                killerid: Player.kInvalidId,
                reason: 0,
            });
        }

        if (player.syncedData.lagCompensationMode !== 2) {
            player.syncedData.lagCompensationMode = 2;  // this will respawn the |player|
        } else {
            player.respawn();
        }

        this.showStats(player);
    }

    restoreDefaultPlayerStatus(player) {
        if (!this.playersInDeathMatch_.has(player))
            return;
        
        const zone = this.playersInDeathMatch_.get(player);
        const location = DeathMatchLocation.getById(zone);

        this.playersInDeathMatch_.delete(player);
        this.playerTeam_.delete(player);
        
        player.activity = Player.PLAYER_ACTIVITY_NONE;
        player.team = Player.kNoTeam;
        if(!isNaN(location.gravity)) 
            player.gravity = Player.kDefaultGravity;

        this.removeTextDrawForPlayer(player, zone);        
        this.resetTeamScoreIfZoneEmpty(zone);
    }

    resetTeamScoreIfZoneEmpty(zone) {
        const numPlayersLeftInZone = [...this.playersInDeathMatch_]
            .filter(item => item[1] === zone)
            .length;

        if (numPlayersLeftInZone === 0 && this.teamScore_.has(zone))
            this.teamScore_.set(zone, new DeathMatchTeamScore());
    }

    showStats(player) {
        if (!this.playerStats_.has(player)) 
            return;

        player.sendMessage(Message.DEATH_MATCH_STATS);

        const snapshot = this.playerStats_.get(player);
        const statistics = player.stats.diff(snapshot);

        player.sendMessage(
            Message.DEATH_MATCH_KILL_DEATH, statistics.killCount, statistics.deathCount,
            statistics.ratio);

        player.sendMessage(
            Message.DEATH_MATCH_DAMAGE_ACCURACY, statistics.damageGiven, statistics.accuracy * 100);
    }

    // If this DM has teams we'll set the player in a team.
    setPlayerTeam(player, zone, team = undefined) {
        const location = DeathMatchLocation.getById(zone);
        if (!location.hasTeams)
            return;

        if (!this.teamScore_.has(zone))
            this.teamScore_.set(zone, new DeathMatchTeamScore());

        if (!this.zoneTextDraws_.has(zone)) {
            this.zoneTextDraws_.set(zone, -1);
            const textDraw = new TextDraw({
                position: [482, 311],
                text: '_',

                color: Color.fromNumberRGBA(-1),
                shadowColor: Color.fromRGBA(0, 0, 0, 255),
                font: 2,
                letterSize: [0.33, 1.5],
                outlineSize: 1,
                proportional: true,
            });


            this.zoneTextDraws_.set(zone, textDraw);
            textDraw.displayForPlayer(player);
        } else {
            const textDraw = this.zoneTextDraws_.get(zone);
            textDraw.displayForPlayer(player);
        }

        this.updateTextDraw(zone);

        if (!isNaN(team) && team < 2) {
            this.playerTeam_.set(player, { zone: zone, team: team });
            return;
        }

        const teams = [...this.playerTeam_]
            .filter(item => item[1].zone === zone)
            .map(item => item[1].team);

        const amountOfRedTeam = teams.filter(item => item === RED_TEAM).length;
        const amountOfBlueTeam = teams.filter(item => item === BLUE_TEAM).length;

        const newTeam = amountOfRedTeam <= amountOfBlueTeam ? RED_TEAM : BLUE_TEAM;

        this.playerTeam_.set(player, { zone: zone, team: newTeam });
    }

    // We want to spawn the player at the right location with the right settings.
    spawnPlayer(player, zone) {
        const location = DeathMatchLocation.getById(zone);
        const spawnPosition = this.findRandomSpawnPosition(location);

        player.activity = Player.PLAYER_ACTIVITY_JS_DM_ZONE;
        player.position = spawnPosition.position;
        player.rotation = spawnPosition.rotation;
        player.health = location.playerHealth;
        player.armour = location.playerArmour;
        player.weather = location.weather;
        player.time = [location.time, 0];
        if(!isNaN(location.gravity))
            player.gravity = location.gravity;

        if (this.playerTeam_.has(player)) {
            const team = this.playerTeam_.get(player).team;

            wait(1).then(() => player.color = team === RED_TEAM ? Color.RED : Color.BLUE);

            if (location.noTeamDamage)
                player.team = team;
        }

        // Make sure this world is set last. TODO: Fix without wait. (e.g. use game API)
        wait(1).then(() => player.virtualWorld = location.world);
        player.interiorId = location.interiorId;

        // Do it in a tiny delay to avoid the player receiving an out of bounds message.
        wait(0).then(() => player.setPlayerBounds(location.boundaries[0], location.boundaries[1],
            location.boundaries[2], location.boundaries[3]));

        player.resetWeapons();
        for (const weaponInfo of location.weapons) {
            player.giveWeapon(weaponInfo.weaponId, weaponInfo.ammo);
        }
    }

    // This returns a semi-random spawn index. It keeps the first quarter of locations used in 
    // memory and will try at max 10 times to get a not recently used spawn index.
    findRandomSpawnPosition(location, attempt = 0) {
        var spawnPositions = [...location.spawnPositions];
        var spawnIndex = Math.floor(Math.random() * spawnPositions.length);
        if (attempt > 10)
            return spawnPositions[spawnIndex];

        if (this.lastQuarterUsedLocationsQueue.includes(spawnIndex))
            return this.findRandomSpawnPosition(location, attempt++);

        this.lastQuarterUsedLocationsQueue.push(spawnIndex);
        if (this.lastQuarterUsedLocationsQueue.length > Math.floor(spawnPositions.length / 4))
            this.lastQuarterUsedLocationsQueue.shift();

        return spawnPositions[spawnIndex];
    }

    // If a player died we'll update stats and reward killer.
    onPlayerDeath(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player)
            return;  // the |player| couldn't be found, this is an invalid death

        if (!this.playersInDeathMatch_.has(player))
            return;

        const killer = server.playerManager.getById(event.killerid);
        if (!killer)
            return;

        if (!this.playersInDeathMatch_.has(killer))
            return;

        const playerSnapshot = this.playerStats_.get(player);
        const playerStatistics = player.stats.diff(playerSnapshot);

        const killerSnapshot = this.playerStats_.get(killer);
        const killerStatistics = killer.stats.diff(killerSnapshot);

        const health = killer.health;
        const armour = killer.armour;

        killer.health = 100;
        killer.armour = Math.min(armour + health, 100);

        killer.sendMessage(Message.DEATH_MATCH_TOTAL_KILLED, killerStatistics.killCount);
        player.sendMessage(Message.DEATH_MATCH_TOTAL_DEATHS, playerStatistics.deathCount);

        this.addKillToTeamForPlayer(killer);
    }

    addKillToTeamForPlayer(player) {
        const zone = this.playersInDeathMatch_.get(player);
        const playerTeam = this.playerTeam_.get(player);
        const teamScore = this.teamScore_.get(zone);
        if (zone === undefined || playerTeam === undefined || teamScore === undefined)
            return;

        if (playerTeam.team === RED_TEAM)
            teamScore.redTeamKills++;
        else
            teamScore.blueTeamKills++;

        this.updateTextDraw(zone);
    }

    updateTextDraw(zone) {
        const teamScore = this.teamScore_.get(zone);
        const textDraw = this.zoneTextDraws_.get(zone);
        if(!textDraw) 
            return;

        const playersInZone = [...this.playersInDeathMatch_]
            .filter(item => item[1] === zone)
            .map(item => item[0]);

        for (const player of playersInZone) {
            textDraw.updateTextForPlayer(player, `~r~Red team: ${teamScore.redTeamKills} kills~n~~b~Blue team: ${teamScore.blueTeamKills} kills`);
        }
    }

    removeTextDrawForPlayer(player, zone = undefined) {
        if(!zone)
            zone = this.playersInDeathMatch_.get(player);
        const textDraw = this.zoneTextDraws_.get(zone);
        if (textDraw === null || textDraw === undefined)
            return;

        textDraw.hideForPlayer(player);
    }

    // When a player spawns while in the mini game we want to teleport him back.
    onPlayerSpawn(player) {
        // The player is playing in a death match
        if (this.playersInDeathMatch_.has(player)) {
            // Remove the player if they're not in the DM_ZONE activity
            if (player.activity !== Player.PLAYER_ACTIVITY_JS_DM_ZONE) {
                this.playersInDeathMatch_.delete(player);
                return;
            }

            this.spawnPlayer(player, this.playersInDeathMatch_.get(player));
        }
    }

    // Called when a player disconnects from the server. Clears out all state for the player.
    onPlayerDisconnect(player) {
        this.restoreDefaultPlayerStatus(player);
        this.playerStats_.delete(player);
    }

    // Returns the identifiers of all the death match locations.
    validDmZones() {
        return DeathMatchLocation.getAllLocationIds();
    }

    dispose() {
        this.callbacks_.dispose();
        this.callbacks_ = null;

        server.playerManager.removeObserver(this);

        for(const textDraw of this.zoneTextDraws_) {
            const playersInZone = [...this.playersInDeathMatch_]
                .filter(item => item[1] === textDraw[0])
                .map(item => item[0]);
    
            for(const player of playersInZone) {
                textDraw[1].hideForPlayer(player);
            }
        }
    }
}

export class DeathMatchTeamScore {
    redTeamKills = 0;
    blueTeamKills = 0;
}
