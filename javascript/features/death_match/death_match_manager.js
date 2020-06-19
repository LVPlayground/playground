// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { DeathMatchLocation } from 'features/death_match/death_match_location.js';
import { ScopedCallbacks } from 'base/scoped_callbacks.js';

// This class will manage the DeathMatch zones. Allowing the player to join and leave at will.
export class DeathMatchManger {
    lastQuarterUsedLocationsQueue = [];

    constructor(abuse, announce) {
        this.abuse_ = abuse;
        this.announce_ = announce;
        this.playersInDeathMatch_ = new Map();

        // Stats of the player. Will not be cleared upon leaving the death match.
        this.playerStats_ = new Map();

        this.callbacks_ = new ScopedCallbacks();
        this.callbacks_.addEventListener(
            'playerresolveddeath', DeathMatchManger.prototype.onPlayerDeath.bind(this));
        this.callbacks_.addEventListener(
            'playerspawn', DeathMatchManger.prototype.onPlayerSpawn.bind(this));
        this.callbacks_.addEventListener(
            'playerdisconnect', DeathMatchManger.prototype.onPlayerDisconnect.bind(this));
    }

    // The player wants to join the death match.
    goToDmZone(player, zone) {
        if (!DeathMatchLocation.hasLocation(zone)) {
            player.sendMessage(Message.DEATH_MATCH_INVALID_ZONE, zone);
            player.sendMessage(Message.DEATH_MATCH_AVAILABLE_ZONES, this.validDmZones().join(', '));
            return;
        }

        if (player.activity !== Player.PLAYER_ACTIVITY_JS_DM_ZONE &&
                player.activity !== Player.PLAYER_ACTIVITY_NONE) {
            player.sendMessage(Message.DEATH_MATCH_TELEPORT_BLOCKED, "you are in another activity.");
            return;
        }

        const teleportStatus = this.abuse_().canTeleport(player, { enforceTimeLimit: true });
        const zoneInfo = DeathMatchLocation.getById(zone);

        // Bail out if the |player| is not currently allowed to teleport.
        if (!teleportStatus.allowed) {
            player.sendMessage(Message.DEATH_MATCH_TELEPORT_BLOCKED, teleportStatus.reason);
            return;
        }

        this.playersInDeathMatch_.set(player.id, zone);
        this.playerStats_.set(player.id, player.stats.snapshot());

        const targetLagCompensationMode = zoneInfo.lagShot ? 0 : 2;

        if (player.syncedData.lagCompensationMode !== targetLagCompensationMode)
            player.syncedData.lagCompensationMode = 0;  // this will respawn the |player|
        else
            this.spawnPlayer(player, zone);

        player.sendMessage(Message.DEATH_MATCH_INSTRUCTION_LEAVE);
        player.sendMessage(Message.DEATH_MATCH_INSTRUCTION_STATS);
        this.announce_().announceToPlayers(Message.DEATH_MATCH_TELEPORTED, player.name, zone);
    }

    // The player decided to leave so we will make him re-spawn. The player will be killed so that 
    // the person who last hit him will get the kill to avoid abuse.
    leave(player) {
        if (!this.playersInDeathMatch_.has(player.id))
            return;

        this.playersInDeathMatch_.delete(player.id);
        player.activity = Player.PLAYER_ACTIVITY_NONE;

        // To avoid abuse we'll kill the player if he had recently fought and let him re-spawn that 
        // way.
        const teleportStatus = this.abuse_().canTeleport(player, { enforceTimeLimit: true });
        if (!teleportStatus.allowed) {
            player.sendMessage(Message.DEATH_MATCH_LEAVE_KILLED, teleportStatus.reason);
            player.health = 0;
        } else if (player.syncedData.lagCompensationMode !== 2) {
            player.syncedData.lagCompensationMode = 2;  // this will respawn the |player|
        } else {
            player.respawn();
        }

        this.showStats(player);
    }

    showStats(player) {
        if (!this.playerStats_.has(player.id)) {
            player.sendMessage(Message.DEATH_MATCH_NO_STATS);
            return;
        }

        player.sendMessage(Message.DEATH_MATCH_STATS);

        const snapshot = this.playerStats_.get(player.id);
        const statistics = player.stats.diff(snapshot);

        player.sendMessage(
            Message.DEATH_MATCH_KILL_DEATH, statistics.killCount, statistics.deathCount,
            statistics.ratio);

        player.sendMessage(
            Message.DEATH_MATCH_DAMAGE_ACCURACY, statistics.damageGiven, statistics.accuracy * 100);
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

        if (!this.playersInDeathMatch_.has(player.id))
            return;

        const killer = server.playerManager.getById(event.killerid);
        if (!killer)
            return;

        if (!this.playersInDeathMatch_.has(killer.id))
            return;

        const playerSnapshot = this.playerStats_.get(player.id);
        const playerStatistics = player.stats.diff(playerSnapshot);

        const killerSnapshot = this.playerStats_.get(killer.id);
        const killerStatistics = killer.stats.diff(killerSnapshot);

        const health = killer.health;
        const armour = killer.armour;

        killer.health = 100;
        killer.armour = Math.min(armour + health, 100);

        killer.sendMessage(Message.DEATH_MATCH_TOTAL_KILLED, killerStatistics.killCount);
        player.sendMessage(Message.DEATH_MATCH_TOTAL_DEATHS, playerStatistics.deathCount);
    }

    // When a player spawns while in the mini game we want to teleport him back.
    onPlayerSpawn(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player)
            return;  // invalid |player| given for the |event|

        // The player is playing in a death match
        if (this.playersInDeathMatch_.has(player.id)) {
            // Remove the player if he's not in the DM_ZONE activity
            if (player.activity !== Player.PLAYER_ACTIVITY_JS_DM_ZONE) {
                this.playersInDeathMatch_.delete(player.id);
                return;
            }

            this.spawnPlayer(player, this.playersInDeathMatch_.get(player.id));
        }
    }

    // Called when a player disconnects from the server. Clears out all state for the player.
    onPlayerDisconnect(event) {
        this.playersInDeathMatch_.delete(event.playerid);
        this.playerStats_.delete(event.playerid);
    }

    // Returns the identifiers of all the death match locations.
    validDmZones() {
        return DeathMatchLocation.getAllLocationIds();
    }

    dispose() {
        this.callbacks_.dispose();
        this.callbacks_ = null;
    }
}