// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { DeathMatchLocation } from 'features/death_match/death_match_location.js';

export class DeathMatchManger {
    lastQuarterUsedLocationsQueue = [];

    constructor(abuse) {
        this.abuse_ = abuse;
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
        
        //TODO: Set player bounds

        //TODO: Reset weapons
        for(const weaponInfo of location.weapons) {
            // TODO: set weapons.
        }

        // TODO: Announce player has joined DM zone.
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

    // Returns all dm location IDs known.
    validDmZones() {
        return DeathMatchLocation.getAllLocationIds();
    }
}