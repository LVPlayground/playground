// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { DeathMatchLocation } from "features/death_match/death_match_location.js";

export class DeathMatchManger {
    constructor(abuse) {
        this.abuse_ = abuse;
    }

    goToDmZone(player, zone) {
        if(!DeathMatchLocation.hasLocation(zone)) {
            player.sendMessage(Message.DEATH_MATCH_INVALID_ZONE, zone);
            player.sendMessage(Message.DEATH_MATCH_AVAILABLE_ZONES, this.validDmZones().join(', '));
            return;
        }

        const location = DeathMatchLocation.getById(zone);
    }

    // Returns all dm location IDs known.
    validDmZones() {
        return DeathMatchLocation.getAllLocationIds();
    }
}