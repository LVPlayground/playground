// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.
// @ts-check

import { ZoneNatives } from 'features/gang_zones/zone_natives.js';

// The ZoneManager receives updates from the ZoneCalculator whenever a gang zone has to be created,
// removed, or amended based on changes in gangs, their members and/or their houses.
export class ZoneManager {
    natives_ = null;

    // Map from Zone instance to an integer representing the zone on the SA-MP server.
    zones_ = null;

    constructor(natives = null) {
        this.natives_ = natives ?? new ZoneNatives();
        this.zones_ = new Map();
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the given |zone| should be created on the server.
    createZone(zone) {
        if (!server.isTest())
            console.log(`[Zone][Create][${zone.gangName}] : [${zone.area.toString()}]`);
        
        const zoneId = this.natives_.createZone(zone.area, zone.color);
        this.zones_.set(zone, zoneId);
    }

    // Called when the given |zone| should be updated. This generally means that its size of colour
    // changed, and the visual appearance should be updated to match.
    updateZone(zone) {
        if (!server.isTest())
            console.log(`[Zone][Update][${zone.gangName}] : [${zone.area.toString()}]`);
        
        const existingZoneId = this.zones_.get(zone);
        if (existingZoneId !== undefined)
            this.natives_.deleteZone(existingZoneId);

        const zoneId = this.natives_.createZone(zone.area, zone.color);
        this.zones_.set(zone, zoneId);
    }

    // Called when the given |zone| should be deleted from the map.
    deleteZone(zone) {
        if (!server.isTest())
            console.log(`[Zone][Delete][${zone.gangName}] : [${zone.area.toString()}]`);
        
        const existingZoneId = this.zones_.get(zone);
        if (existingZoneId === undefined)
            return;

        this.natives_.deleteZone(existingZoneId);
        this.zones_.delete(zone);
    }

    // --------------------------------------------------------------------------------------------

    dispose() {}
}
