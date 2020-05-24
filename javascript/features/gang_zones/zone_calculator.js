// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.
// @ts-check

import { Zone } from 'features/gang_zones/structures/zone.js';

import { meanShift } from 'features/gang_zones/mean_shift.js';

// The zone calculator is notified whenever updated information of an active gang is available,
// which will be used to determine whether display of a zone is appropriate.
export class ZoneCalculator {
    manager_ = null;
    settings_ = null;

    // Map of gangId (number) => Set of live Zone instances on the server.
    zones_ = null;

    constructor(manager, settings) {
        this.manager_ = manager;
        this.settings_ = settings;
        this.zones_ = new Map();
    }

    // ---------------------------------------------------------------------------------------------
    // Delegate: ZoneDataAggregator
    // ---------------------------------------------------------------------------------------------

    // Called when the |zoneGang| has been updated, and we need to decide whether they deserve one
    // or more gang zones. This is also called when new active gangs are being introduced.
    onGangUpdated(zoneGang) {
        const areas = this.computeGangAreas(zoneGang);

        const existingZones = this.zones_.get(zoneGang.id) || new Set();
        const updatedZones = new Set();

        // (1) Process all new and updated |areas| first. Existing areas will be updated when their
        //     area overlaps with the area of the new zone, however slightly.
        areas.forEach(info => {
            for (const existingZone of existingZones) {
                if (!existingZone.area.overlaps(info.area))
                    continue;
                
                existingZones.delete(existingZone);
                updatedZones.add(existingZone);

                const flags = existingZone.update(info);

                this.manager_.updateZone(existingZone, flags);
                return;
            }

            const createdZone = new Zone(zoneGang, info);
            updatedZones.add(createdZone);

            this.manager_.createZone(createdZone);
        });

        // (2) For each of the remaining zones in the |existingZones|, delete them from the map as
        //     they have been deactivated as a consequence of changes in the gang.
        for (const zone of existingZones)
            this.manager_.deleteZone(zone);

        // (3) Store the latest set of zones, so that we can repeat this over and over again.
        this.zones_.set(zoneGang.id, updatedZones);
    }

    // Called when the |zoneGang| has been deactivated, and no longer deserves a gang zone because
    // one of the earlier requirements has failed.
    onGangDeactivated(zoneGang) {
        const zones = this.zones_.get(zoneGang.id);
        if (!zones)
            return;  // the gang qualified for zones, but never actually had any
        
        for (const zone of zones)
            this.manager_.deleteZone(zone);
        
        this.zones_.delete(zoneGang.id);
    }

    // ---------------------------------------------------------------------------------------------

    // Computes the areas that the |zoneGang| is active in. This maps to Step 3. of the zone
    // dominance algorithm described in README.md, and uses a mean shift algorithm to determine the
    // main clusters of houses owned by a particular gang.
    //
    // This function computes, and returns, various enclosing boundaries for each of the computed
    // zones. This might help in debugging the zones later on. In order of increasing size:
    //
    //   * `enclosingArea`  The bounding box that strictly encapsulates all of the house locations.
    //
    //   * `paddedArea`     The enclosing area, with a percentage of padding applied. This is
    //                      significant because zones don't end next to somebody's door.
    //
    //   * `viableArea`     The viable area: extension on the padded area that increases the area by
    //                      the configured minimum size, while maintaining the area's shape.
    //
    //   * `area`           The gang area after applying the bonuses that this area is eligible for.
    //
    // The list of bonuses, as well as other meta information, will be returned for completeness.
    computeGangAreas(zoneGang) {
        const kZoneAreaMeanShiftBandwidth = this.getSettingValue('zones_area_mean_shift_bandwidth');

        const houseLocations = [];
        const houseOwnerVip = new Set();

        for (const member of zoneGang.members.values()) {
            if (member.isVip())
                houseOwnerVip.add(member.userId);

            for (const location of member.houses)
                houseLocations.push([ location.position.x, location.position.y, location ]);
        }

        // Use the mean-shift algorithm to determine clusters within the |houseLocations|, given the
        // maximum distance from the cluster's center as the algorithm's bandwidth.
        const clusters = meanShift(houseLocations, { bandwidth: kZoneAreaMeanShiftBandwidth });
        const areas = [];

        // The minimum number of members that need to have a house in a particular area.
        const kMinimumRepresentationInArea = this.getSettingValue('zones_area_min_members');

        for (const cluster of clusters) {
            if (cluster.length < kMinimumRepresentationInArea)
                continue;  // quick bail out: not enough houses in the cluster

            const bounds = {
                x: { min: Number.MAX_SAFE_INTEGER, max: Number.MIN_SAFE_INTEGER },
                y: { min: Number.MAX_SAFE_INTEGER, max: Number.MIN_SAFE_INTEGER },
            };

            const locations = new Set();
            const members = new Set();

            // Iterate over all locations in the clusters to record their owner, and capture the
            // location's boundaries within the calcualted |bounds|.
            for (const [,, location] of cluster) {
                locations.add(location);
                members.add(location.settings.ownerId);

                bounds.x.min = Math.min(bounds.x.min, location.position.x);
                bounds.x.max = Math.max(bounds.x.max, location.position.x);
                bounds.y.min = Math.min(bounds.y.min, location.position.y);
                bounds.y.max = Math.max(bounds.y.max, location.position.y);
            }

            if (members.size < kMinimumRepresentationInArea)
                continue;  // bail out: not enough members are represented in the cluster

            const bonuses = new Set();

            const enclosingArea = new Rect(bounds.x.min, bounds.y.min, bounds.x.max, bounds.y.max);
            const enclosingRatio = enclosingArea.width / enclosingArea.height;

            // -------------------------------------------------------------------------------------
            // Apply the |kAreaPaddingFactor| to the boundary area, because the entrance positions
            // of the individual houses are not supposed to be entirely on the boundary.
            const kAreaPaddingFactor = this.getSettingValue('zones_area_padded_percentage') / 100;

            const horizontalPadding = enclosingArea.width * kAreaPaddingFactor;
            const verticalPadding = enclosingArea.height * kAreaPaddingFactor;
            
            const paddedArea = enclosingArea.extend(horizontalPadding, verticalPadding);

            // -------------------------------------------------------------------------------------
            // Extend the |paddedArea| to make sure that it meets the minimum area size, both on the
            // horizontal and vertical axes, by measuring the edge. The shape will be maintained.
            const kAreaMinimumEdgeLength = this.getSettingValue('zones_area_viable_edge_length');

            let horizontalViableExtension = 0;
            let verticalViableExtension = 0;

            if (paddedArea.width < kAreaMinimumEdgeLength)
                horizontalViableExtension = (kAreaMinimumEdgeLength - paddedArea.width) / 2;

            if (paddedArea.height < kAreaMinimumEdgeLength)
                verticalViableExtension = (kAreaMinimumEdgeLength - paddedArea.height) / 2;

            // -------------------------------------------------------------------------------------
            // Allow the gang's area to roughly maintain its shape in extreme cases, allowing for
            // areas to be rectangular in shape where it makes sense.
            const kShapeThreshold = this.getSettingValue('zones_area_viable_shape_threshold') / 100;
            const kShapeAdjust = (this.getSettingValue('zones_area_viable_shape_adjust') / 100) + 1;

            if (enclosingRatio < (1 - kShapeThreshold)) {
                horizontalViableExtension /= kShapeAdjust;
                verticalViableExtension *= kShapeAdjust;

            } else if (enclosingRatio > (1 + kShapeThreshold)) {
                horizontalViableExtension *= kShapeAdjust;
                verticalViableExtension /= kShapeAdjust;
            }

            const viableArea =
                paddedArea.extend(horizontalViableExtension, verticalViableExtension);
            
            // -------------------------------------------------------------------------------------
            // Gang areas enjoy several bonus units for free, based on absolute data, e.g. the
            // number of active members in the area. There also are bonuses that they have to pay
            // for, as a means to equalize the economy by moving money to pixels.
            let bonusUnits = 0;

            // (1) "medium-gang": increase when the area has a certain number of active members.
            if (members.size >= this.getSettingValue('zones_area_bonus_medium_count')) {
                bonusUnits += this.getSettingValue('zones_area_bonus_medium_units');
                bonuses.add('medium-gang');
            }

            // (2) "large-gang": increase when the area has a certain number of active members.
            if (members.size >= this.getSettingValue('zones_area_bonus_large_count')) {
                bonusUnits += this.getSettingValue('zones_area_bonus_large_units');
                bonuses.add('large-gang');
            }

            // (3) "vip-member": increase given for each VIP that owns a house in this area.
            for (const userId of members) {
                if (!houseOwnerVip.has(userId))
                    continue;
                
                bonusUnits += this.getSettingValue('zones_area_bonus_vip_units');
                bonuses.add('vip-member');
            }

            const area = viableArea.extend(bonusUnits, bonusUnits);
            
            // -------------------------------------------------------------------------------------
            // Store all relevant information of the area, as other parts of the system might want
            // to visualize and explain why a certain area has a certain size.
            areas.push({
                memberCount: members.size,
                houseCount: locations.size,
                bonuses,

                enclosingArea,
                paddedArea,
                viableArea,
                area
            });
        }

        // Sort the areas by their size, and only return the configured number of areas for this
        // partiular gang, as we don't want to spam the map with too many areas.
        areas.sort((left, right) => {
            if (left.area.area === right.area.area)
                return 1;
            
            return left.area.area > right.area.area ? -1 : 1;
        });

        return areas.slice(0, this.getSettingValue('zones_area_limit'));
    }

    // ---------------------------------------------------------------------------------------------

    // Returns the value of the |setting| in the gangs/ namespace.
    getSettingValue(setting) {
        return this.settings_().getValue('gangs/' + setting);
    }

    dispose() {}
}
