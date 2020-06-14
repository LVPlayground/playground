// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.
// @ts-check

import { ScopedCallbacks } from 'base/scoped_callbacks.js';
import ScopedEntities from 'entities/scoped_entities.js';
import { ZoneNatives } from 'features/gang_zones/zone_natives.js';

// The zone area manager is responsible for maintaining the areas, both on the map and in the
// streamer, for each of the gang zones created on the server. It will send targetted updates back
// to the Zone Manager (which owns us), so that manipulations can be acted upon.
export class ZoneAreaManager {
    manager_ = null;

    callbacks_ = null;
    entities_ = null;
    natives_ = null;
    zones_ = null;

    // Map from Area instance to the Zone that it represents.
    areaToZone_ = null;
    zoneToArea_ = null;

    constructor(manager, natives = undefined) {
        this.manager_ = manager;

        this.natives_ = natives ?? new ZoneNatives();
        this.entities_ = new ScopedEntities({ interiorId: 0, virtualWorld: 0 });
        this.zones_ = new Map();

        this.areaToZone_ = new Map();
        this.zoneToArea_ = new Map();

        this.callbacks_ = new ScopedCallbacks();
        this.callbacks_.addEventListener(
            'playerspawn', ZoneAreaManager.prototype.onPlayerSpawn.bind(this));
    }

    // ---------------------------------------------------------------------------------------------

    // Creates all the assets necessary for the given |zone|, i.e. its actual gang zone and area.
    createZone(zone) {
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
    deleteZone(zone) {
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
        
        this.manager_.onPlayerEnterZone(player, zone);
    }

    // Called when the |player| has left the |area|, which is one of our gang zones.
    onPlayerLeaveArea(player, area) {
        const zone = this.areaToZone_.get(area);
        if (!zone)
            throw new Error(`${player.name} left an invalid area: ${area}`);
        
        this.manager_.onPlayerLeaveZone(player, zone);
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
