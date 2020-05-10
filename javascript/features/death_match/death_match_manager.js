// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { DeathMatchLocation } from 'features/death_match/death_match_location.js';

export class DeathMatchManger {
    lastQuarterUsedLocationsQueue = [];

    constructor(abuse) {
        this.abuse_ = abuse;
    }

    goToDmZone(player, zone) {
        if (!DeathMatchLocation.hasLocation(zone)) {
            player.sendMessage(Message.DEATH_MATCH_INVALID_ZONE, zone);
            player.sendMessage(Message.DEATH_MATCH_AVAILABLE_ZONES, this.validDmZones().join(', '));
            return;
        }

        //TODO (OttoRocket): check for abuse.

        //TODO (OttoRocket): Write unit tests. (Should've done first anyway!)
        const location = DeathMatchLocation.getById(zone);

        player.activity = Player.PLAYER_ACTIVITY_JS_DM_ZONE;

        const spawnPosition = this.findRandomSpawnPosition(location);

        player.position = spawnPosition.position;
        player.rotation = spawnPosition.rotation;
        player.health = 100; //TODO (OttoRocket): Make configurable.
        player.armour = 100; //TODO (OttoRocket): Make configurable.
        player.weather = 10; //TODO (OttoRocket): Make configurable.
        player.time = 12; //TODO (OttoRocket): Make configurable.
        player.virtualWorld = location.world;
        player.interiorId = location.interior_id;

        //TODO (OttoRocket): Allow to configure playing a custom fight start audio stream.
    }

    // This returns a semi-random spawn index. It keeps the first quarter of locations used in 
    // memory and will try at max 10 times to generate a not recently randomized spawn index.
    findRandomSpawnPosition(location, attempt = 0) {
        // TODO (OttoRocket): Find a better way to get length than this shitty array casting.
        var spawnIndex = Math.floor(Math.random() * [...location.spawnPositions].length);
        if (attempt > 10) {
            return [...location.spawnPositions][spawnIndex];
        }

        if (this.lastQuarterUsedLocationsQueue.includes(spawnIndex)) {
            return this.findRandomSpawnPosition(location, attempt++);
        }

        this.lastQuarterUsedLocationsQueue.push(spawnIndex);
        if (this.lastQuarterUsedLocationsQueue.length >
            Math.floor([...location.spawnPositions].length / 4)
        ) {
            this.lastQuarterUsedLocationsQueue.pop();
        }

        return [...location.spawnPositions][spawnIndex];
    }

    // Returns all dm location IDs known.
    validDmZones() {
        return DeathMatchLocation.getAllLocationIds();
    }
}