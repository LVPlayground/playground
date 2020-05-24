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

    // Called when the given |zone| should be updated. The |flags| argument detail exactly what has
    // changed about the zone, as not all updates need state to be recreated.
    updateZone(zone, flags) {
        if (!server.isTest())
            console.log(`[Zone][Update][${zone.gangName}] : [${zone.area.toString()}]`);
    
        // Completely recreate the area if either the area or colour changed, as these have to be
        // reflected on maps shown on players' screens.
        if (flags.areaChanged || flags.colorChanged) {
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
