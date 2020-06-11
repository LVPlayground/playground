// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.
// @ts-check

import { ZoneAreaManager } from 'features/gang_zones/zone_area_manager.js';
import { ZoneDecorations } from 'features/gang_zones/zone_decorations.js';
import { ZoneFinances } from 'features/gang_zones/zone_finances.js';

// Time between zone enter notifications for a player, in milliseconds.
const kZoneEnterMessageRateMs = 10000;

// The ZoneManager receives updates from the ZoneCalculator whenever a gang zone has to be created,
// removed, or amended based on changes in gangs, their members and/or their houses.
export class ZoneManager {
    areaManager_ = null;
    decorations_ = null;
    finances_ = null;

    currentZone_ = new WeakMap();
    notification_ = new WeakMap();

    // Gets the object responsible for dealing with decorations in gang zones.
    get decorations() { return this.decorations_; }

    // Gets the object responsible for dealing with finances in gang zones.
    get finances() { return this.finances_; }

    constructor(database) {
        this.areaManager_ = new ZoneAreaManager(this);
        this.decorations_ = new ZoneDecorations(database);
        this.finances_ = new ZoneFinances();
    }

    // Returns the Zone instance that the |player| is currently in, if any.
    getZoneForPlayer(player) { return this.currentZone_.get(player) ?? null; }

    // ---------------------------------------------------------------------------------------------
    // Implementation for the ZoneCalculator:
    // ---------------------------------------------------------------------------------------------

    // Called when the given |zone| should be created on the server.
    createZone(zone) {
        this.areaManager_.createZone(zone);
        this.decorations_.initializeZone(zone);
    }

    // Called when the given |zone| should be updated. The |flags| argument detail exactly what has
    // changed about the zone, as not all updates need state to be recreated.
    updateZone(zone, flags) {
        // Completely recreate the area if either the area or colour changed, as these have to be
        // reflected on maps shown on players' screens.
        if (flags.areaChanged || flags.colorChanged) {
            this.areaManager_.deleteZone(zone);
            this.areaManager_.createZone(zone);
        }

        // If the area changed, then the decorations within the zone might have to be updated.
        if (flags.areaChanged)
            this.decorations_.updateZone(zone);
    }

    // Called when the given |zone| should be deleted from the map.
    deleteZone(zone) {
        this.areaManager_.deleteZone(zone);
        this.decorations_.deleteZone(zone);
    }

    // ---------------------------------------------------------------------------------------------
    // Implementation for the ZoneAreaManager:
    // ---------------------------------------------------------------------------------------------

    // Called when the |player| has entered the |zone|.
    onPlayerEnterZone(player, zone) {
        this.currentZone_.set(player, zone);

        const currentTime = server.clock.monotonicallyIncreasingTime();
        const difference = currentTime - (this.notification_.get(player) ?? 0);

        if (difference > kZoneEnterMessageRateMs) {
            this.notification_.set(player, currentTime);

            player.sendMessage(
                Message.GANG_ZONE_ENTERED, zone.color.toHexRGB(), zone.gangName, zone.gangGoal);
        }
    }

    // Called when the |player| has left the |zone|.
    onPlayerLeaveZone(player, zone) {
        this.currentZone_.delete(player);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.areaManager_.dispose();
        this.areaManager_ = null;

        this.decorations_.dispose();
        this.decorations_ = null;

        this.finances_.dispose();
        this.finances_ = null;
    }
}
