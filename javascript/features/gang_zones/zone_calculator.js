// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { getClustersForSanAndreas } from 'features/gang_zones/clustering.js';

// The zone calculator is notified whenever updated information of an active gang is available,
// which will be used to determine whether display of a zone is appropriate.
export class ZoneCalculator {
    manager_ = null;

    constructor(manager, settings) {
        this.manager_ = manager;
        this.settings_ = settings;
    }

    // ---------------------------------------------------------------------------------------------
    // Delegate: ZoneDataAggregator
    // ---------------------------------------------------------------------------------------------

    // Called when the |zoneGang| has been updated, and we need to decide whether they deserve one
    // or more gang zones. This is also called when new active gangs are being introduced.
    onGangUpdated(zoneGang) {
        const areas = this.computeGangAreas(zoneGang);
        if (areas.length) {
            console.log(`${zoneGang.name} has ${areas.length} areas.`);
            for (const { area } of areas) {
                console.log(`- [${area.minX}, ${area.minY}, ${area.maxX}, ${area.maxY}]`)
            }
        }
    }

    // Called when the |zoneGang| has been deactivated, and no longer deserves a gang zone because
    // one of the earlier requirements has failed.
    onGangDeactivated(zoneGang) {

    }

    // ---------------------------------------------------------------------------------------------

    // Computes the areas that the |zoneGang| is active in. This maps to Step 3. of the zone
    // dominance algorithm described in README.md, and uses a specialized k-means clustering routine
    // for identifying up to 12 areas in the world of San Andreas.
    computeGangAreas(zoneGang) {
        const houseLocations = [];

        for (const member of zoneGang.members.values()) {
            for (const location of member.houses)
                houseLocations.push([ location.position.x, location.position.y, location ]);
        }

        const areas = [];
        const clusters = getClustersForSanAndreas(houseLocations, {
            maximumClusters: this.getSettingValue('zones_cluster_limit'),
        });

        const kMinimumRepresentationInArea =
            this.getSettingValue('zones_area_min_representation') / 100;
        const kMaximumDistanceFromAreaMean = this.getSettingValue('zones_area_max_distance');

        for (const { mean } of clusters) {
            const meanVector = new Vector(...mean);

            let bounds = {
                x: { min: Number.MAX_SAFE_INTEGER, max: Number.MIN_SAFE_INTEGER },
                y: { min: Number.MAX_SAFE_INTEGER, max: Number.MIN_SAFE_INTEGER },
            };

            let locations = new Set();
            let members = new Set();

            // Find all the locations that are close enough to the cluster's mean. We store both the
            // location and the owning member to determine the representation factor.
            for (const [,, location] of houseLocations) {
                if (!location.position.closeTo(meanVector, kMaximumDistanceFromAreaMean))
                    continue;
                
                locations.add(location);
                members.add(location.settings.ownerId);

                bounds.x.min = Math.min(bounds.x.min, location.position.x);
                bounds.x.max = Math.max(bounds.x.max, location.position.x);
                bounds.y.min = Math.min(bounds.y.min, location.position.y);
                bounds.y.max = Math.max(bounds.y.max, location.position.y);
            }

            const representationFraction = members.size / zoneGang.members.size;
            if (representationFraction < kMinimumRepresentationInArea)
                continue;

            const kAreaPaddingFactor = this.getSettingValue('zones_area_padding_pct') / 100;

            const bonuses = [];
            const enclosingArea = new Rect(bounds.x.min, bounds.y.min, bounds.x.max, bounds.y.max);

            // Apply the |kAreaPaddingFactor| to the enclosing area, because the entrance positions
            // of the individual houses are not supposed to be entirely on the boundary.
            const horizontalPadding = enclosingArea.width * kAreaPaddingFactor;
            const verticalPadding = enclosingArea.height * kAreaPaddingFactor;
            
            const paddedArea = enclosingArea.extend(horizontalPadding, verticalPadding);
            let area = paddedArea;

            // Apply the area bonuses to the padded area. These have different requirements, and are
            // documented properly in the README.md file.
            let bonusFactor = 0;

            // (1) Member bonus: increase when the area has a certain number of active members.
            if (members.size >= this.getSettingValue('zones_area_bonus_members')) {
                bonusFactor += this.getSettingValue('zones_area_bonus_members_pct') / 100;
                bonuses.push('member_bonus');
            }

            if (bonusFactor > 0) {
                const horizontalBonusPadding = paddedArea.width * bonusFactor;
                const verticalBonusPadding = paddedArea.height * bonusFactor;

                area = paddedArea.extend(horizontalBonusPadding, verticalBonusPadding);
            }

            // Store all relevant information of the area, as other parts of the system might want
            // to visualize and explain why a certain area has a certain size.
            areas.push({
                memberCount: members.length,
                houseCount: locations.length,
                representation: Math.round(representationFraction * 100),
                enclosingArea,
                paddedArea,
                bonuses,
                area
            });
        }

        return areas;
    }

    // ---------------------------------------------------------------------------------------------

    // Returns the value of the |setting| in the gangs/ namespace.
    getSettingValue(setting) {
        return this.settings_().getValue('gangs/' + setting);
    }

    dispose() {

    }
}
