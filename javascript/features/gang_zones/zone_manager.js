// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.
// @ts-check

import { ZoneAreaManager } from 'features/gang_zones/zone_area_manager.js';

// The ZoneManager receives updates from the ZoneCalculator whenever a gang zone has to be created,
// removed, or amended based on changes in gangs, their members and/or their houses.
export class ZoneManager {
    areaManager_ = null;

    constructor() {
        this.areaManager_ = new ZoneAreaManager(this);
    }

    // ---------------------------------------------------------------------------------------------
    // Implementation for the ZoneCalculator:
    // ---------------------------------------------------------------------------------------------

    // Called when the given |zone| should be created on the server.
    createZone(zone) {
        if (!server.isTest())
            console.log(`[Zone][Create][${zone.gangName}] : [${zone.area.toString()}]`);
        
        this.areaManager_.createZone(zone);
    }

    // Called when the given |zone| should be updated. The |substantial| argument is true when the
    // zone's area changed, otherwise it's a change in zone metadata.
    updateZone(zone, substantial) {
        if (!server.isTest())
            console.log(`[Zone][Update][${zone.gangName}] : [${zone.area.toString()}]`);
    
        // Completely recreate the area if this is a substantial update, as there is no better way
        // to change the colours or move the zone's data otherwise.
        if (substantial) {
            this.areaManager_.deleteZone(zone);
            this.areaManager_.createZone(zone);
        }
    }

    // Called when the given |zone| should be deleted from the map.
    deleteZone(zone) {
        if (!server.isTest())
            console.log(`[Zone][Delete][${zone.gangName}] : [${zone.area.toString()}]`);
        
        this.areaManager_.deleteZone(zone);
    }

    // ---------------------------------------------------------------------------------------------
    // Implementation for the ZoneAreaManager:
    // ---------------------------------------------------------------------------------------------

    onPlayerEnterZone(player, zone) {
        player.sendMessage(
            Message.GANG_ZONE_ENTERED, zone.color.toHexRGB(), zone.gangName, zone.gangGoal);

        if (!server.isTest())
            console.log(`[Zone][Enter][${zone.gangName}] : [${player.name}]`);
    }

    onPlayerLeaveZone(player, zone) {
        if (!server.isTest())
            console.log(`[Zone][Leave][${zone.gangName}] : [${player.name}]`);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.areaManager_.dispose();
        this.areaManager_ = null;
    }
}
