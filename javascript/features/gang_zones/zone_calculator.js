// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { getClustersForSanAndreas } from 'features/gang_zones/clustering.js';

// The maximum distance a house may be from the gang area's center in order to be part of it.
const kMaximumDistance = 100;

// The minimum fraction of active gang members that need to have a house in the gang area in order
// for the area to be considered as a real gang area.
const kMinimumActiveMemberFractionForArea = 0.6;

// The zone calculator is notified whenever updated information of an active gang is available,
// which will be used to determine whether display of a zone is appropriate.
export class ZoneCalculator {
    manager_ = null;

    constructor(manager) {
        this.manager_ = manager;
    }

    // ---------------------------------------------------------------------------------------------
    // Delegate: ZoneDataAggregator
    // ---------------------------------------------------------------------------------------------

    // Called when the |zoneGang| has been updated, and we need to decide whether they deserve one
    // or more gang zones. This is also called when new active gangs are being introduced.
    onGangUpdated(zoneGang) {
        const areas = this.computeGangAreas(zoneGang);
        if (areas.length)
            console.log(`${zoneGang.name} has ${areas.length} areas.`);
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

        const clusters = getClustersForSanAndreas(houseLocations, { maximumClusters: 3 });
        const areas = [];

        for (const { mean } of clusters) {
            const meanVector = new Vector(...mean);

            let locations = new Set();
            let members = new Set();

            for (const [,, location] of houseLocations) {
                if (!location.position.closeTo(meanVector, kMaximumDistance))
                    continue;
                
                locations.add(location);
                members.add(location.settings.ownerId);
            }

            const representationFraction = members.size / zoneGang.members.size;
            if (representationFraction < kMinimumActiveMemberFractionForArea)
                continue;

            areas.push({
                mean: meanVector,
                locations: locations.size
            });
        }

        return areas;
    }

    // ---------------------------------------------------------------------------------------------

    disposed() {

    }
}
