// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.
// @ts-check

import ScopedCallbacks from 'base/scoped_callbacks.js';
import ScopedEntities from 'entities/scoped_entities.js';
import { ZoneNatives } from 'features/gang_zones/zone_natives.js';

// The ZoneManager receives updates from the ZoneCalculator whenever a gang zone has to be created,
// removed, or amended based on changes in gangs, their members and/or their houses.
export class ZoneManager {
    callbacks_ = null;
    entities_ = null;
    natives_ = null;

    // Map from Area instance to the Zone that it represents.
    areaToZone_ = null;
    zoneToArea_ = null;

    // Map from Zone instance to an integer representing the zone on the SA-MP server.
    zones_ = null;

    constructor(natives = null) {
        this.natives_ = natives ?? new ZoneNatives();
        this.entities_ = new ScopedEntities({ interiorId: 0, virtualWorld: 0 });

        this.areaToZone_ = new Map();
        this.zoneToArea_ = new Map();

        this.zones_ = new Map();

        this.callbacks_ = new ScopedCallbacks();
        this.callbacks_.addEventListener(
            'playerspawn', ZoneManager.prototype.onPlayerSpawn.bind(this));
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the given |zone| should be created on the server.
    createZone(zone) {
        if (!server.isTest())
            console.log(`[Zone][Create][${zone.gangName}] : [${zone.area.toString()}]`);
        
        this.createZoneAssets(zone);
    }

    // Called when the given |zone| should be updated. This generally means that its size of colour
    // changed, and the visual appearance should be updated to match.
    updateZone(zone) {
        if (!server.isTest())
            console.log(`[Zone][Update][${zone.gangName}] : [${zone.area.toString()}]`);
        
        this.deleteZoneAssets(zone);
        this.createZoneAssets(zone);
    }

    // Creates all the assets necessary for the given |zone|, i.e. its actual gang zone and area.
    createZoneAssets(zone) {
        // Create the gang zone that represents this |zone|.
        const zoneId = this.natives_.createZone(zone.area, zone.color);
        this.zones_.set(zone, zoneId);

        // Create the area that represents this |zone|.
        const area = this.entities_.createRectangularArea(zone.area);
        this.areaToZone_.set(area, zone);
        this.zoneToArea_.set(zone, area);

        area.addObserver(this);
    }

    // Deletes all the assets owned by the |zone|, i.e. its gang zone and area.
    deleteZoneAssets(zone) {
        const zoneId = this.zones_.get(zone);
        if (zoneId) {
            this.natives_.deleteZone(zoneId);
            this.zones_.delete(zone);
        }

        const area = this.zoneToArea_.get(zone);
        if (area) {
            area.dispose();

            this.areaToZone_.delete(area);
            this.zoneToArea_.delete(zone);
        }
    }

    // Called when the given |zone| should be deleted from the map.
    deleteZone(zone) {
        if (!server.isTest())
            console.log(`[Zone][Delete][${zone.gangName}] : [${zone.area.toString()}]`);
        
        this.deleteZoneAssets(zone);

        this.zones_.delete(zone);
    }

    // ---------------------------------------------------------------------------------------------

    // Gang zones have to be shown each time a player spawns, rather than just once.
    onPlayerSpawn(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player)
            return;  // the event was invoked for an invalid player

        for (const [zone, zoneId] of this.zones_.entries())
            this.natives_.showZoneForPlayer(player, zoneId, zone.color);
    }

    // Called when the |player| has entered the |area|, which is one of our gang zones.
    onPlayerEnterArea(player, area) {
        const zone = this.areaToZone_.get(area);
        if (!zone)
            throw new Error(`${player.name} entered an invalid area: ${area}`);
        
        console.log(`[Zone][Enter][${zone.gangName}] : [${player.name}]`);
    }

    // Called when the |player| has left the |area|, which is one of our gang zones.
    onPlayerLeaveArea(player, area) {
        const zone = this.areaToZone_.get(area);
        if (!zone)
            throw new Error(`${player.name} left an invalid area: ${area}`);
        
        console.log(`[Zone][Leave][${zone.gangName}] : [${player.name}]`);
    }

    // --------------------------------------------------------------------------------------------

    dispose() {
        this.entities_.dispose();
        this.entities_ = null;

        this.callbacks_.dispose();
        this.callbacks_ = null;

        this.areaToZone_.clear();
        this.zoneToArea_.clear();
        this.zones_.clear();
    }
}
