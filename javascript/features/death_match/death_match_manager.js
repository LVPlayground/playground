// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import ScopedCallbacks from 'base/scoped_callbacks.js';

import { DeathMatchLocation } from 'features/death_match/death_match_location.js';

// This class will manage the DeathMatch zones. Allowing the player to join and leave at will.
export class DeathMatchManger {
    lastQuarterUsedLocationsQueue = [];

    constructor(abuse, announce) {
        this.abuse_ = abuse;
        this.announce_ = announce;
        this.playersInDeathMatch_ = new Map();

        this.callbacks_ = new ScopedCallbacks();
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

        const teleportStatus = this.abuse_().canTeleport(player, { enforceTimeLimit: true });

        // Bail out if the |player| is not currently allowed to teleport.
        if (!teleportStatus.allowed) {
            player.sendMessage(Message.DEATH_MATCH_TELEPORT_BLOCKED, teleportStatus.reason);
            return;
        }

        this.spawnPlayer(player, zone);

        this.playersInDeathMatch_.set(player.id, zone);
        this.announce_().announceToPlayers(Message.DEATH_MATCH_TELEPORTED, player.name, zone);
    }

    // The player decided to leave.
    leave(player) {
        if(!this.playersInDeathMatch_.has(player.id)) {
            return;
        }

        this.playersInDeathMatch_.delete(player.id);
        player.activity = Player.PLAYER_ACTIVITY_NONE;
        
        // To avoid abuse we'll kill the player if he had recently fought and let him spawn that 
        // way.
        const teleportStatus = this.abuse_().canTeleport(player, { enforceTimeLimit: true });
        if (!teleportStatus.allowed) {
            player.sendMessage(Message.DEATH_MATCH_LEAVE_KILLED, teleportStatus.reason);
            player.health = 0; 
            
            return;           
        }

        player.respawn();
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
        player.virtualWorld = location.world;
        player.interiorId = location.interiorId;

        // Do it in a tiny delay to make sure player is to avoid a 'out of bounds' message
        wait(0).then(() => player.setPlayerBounds(location.boundaries[0], location.boundaries[1], 
            location.boundaries[2], location.boundaries[3]));
        

        player.resetWeapons();
        for(const weaponInfo of location.weapons) {
            player.giveWeapon(weaponInfo.weaponId, weaponInfo.ammo);
        }
    }

    // This returns a semi-random spawn index. It keeps the first quarter of locations used in 
    // memory and will try at max 10 times to generate a not recently randomized spawn index.
    findRandomSpawnPosition(location, attempt = 0) {
        var spawnPositions = [...location.spawnPositions];
        var spawnIndex = Math.floor(Math.random() * spawnPositions.length);
        if (attempt > 10) {
            return spawnPositions[spawnIndex];
        }

        if (this.lastQuarterUsedLocationsQueue.includes(spawnIndex)) {
            return this.findRandomSpawnPosition(location, attempt++);
        }

        this.lastQuarterUsedLocationsQueue.push(spawnIndex);
        if (this.lastQuarterUsedLocationsQueue.length >
            Math.floor(spawnPositions.length / 4)
        ) {
            this.lastQuarterUsedLocationsQueue.pop();
        }

        return spawnPositions[spawnIndex];
    }    

    // When a player spawns while in the mini game we want to teleport him back.
    onPlayerSpawn(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player)
            return;  // invalid |player| given for the |event|

        // The player is playing in a death match
        if(this.playersInDeathMatch_.has(player.id)) {
            this.spawnPlayer(player, this.playersInDeathMatch_.get(player.id));
        }
    }

    // Called when a player disconnects from the server. Clears out all state for the player.
    onPlayerDisconnect(event) {
        this.playersInDeathMatch_.delete(event.playerid);
    }

    // Returns the identifiers of all the death match locations.
    validDmZones() {
        return DeathMatchLocation.getAllLocationIds();
    }
}