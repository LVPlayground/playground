// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { ZoneGang } from 'features/gang_zones/structures/zone_gang.js';
import { ZoneMember } from 'features/gang_zones/structures/zone_member.js';

// Minimum number of active members required for a gang to be considered "active".
export const kZoneDominanceActiveMemberRequirement = 5;

// The zone data aggregator is responsible for determining which gangs have the ability to display
// and control a gang zone, and the contents therein.
//
// On initialisation of this feature, it determines the active gangs on the server through activity
// of their members. This is influenced by their member's last online time and their online time.
// Houses of active members will be located, and their location assesses "area dominance".
//
// While Las Venturas Playground is running, mutations to either the members of gangs, or of houses
// and their owners, will be used to amend this information. All available information will be
// passed to the ZoneCalculator, which is responsible for calculating zone appropriateness.
export class ZoneDataAggregator {
    database_ = null;
    gangs_ = null;

    constructor(database) {
        this.database_ = database;
        this.gangs_ = new Map();
    }

    // Gets the map of gangs that are known to the data aggregator.
    get gangs() { return this.gangs_; }

    // Initialises the initial state of the zone data aggregator, by fetching all active player and
    // gang information from the database, and building an internal cache from that.
    async initialize() {
        const activeMembers = await this.database_.getActiveMembers();
        
        // Pre-populate our internal knowledge of all active gangs based on the |activeMembers|.
        // This is step (1) of the gang dominance determination algorithm in README.md.
        for (const member of activeMembers) {
            let zoneGang = this.gangs_.get(member.gangId);
            if (!zoneGang) {
                zoneGang = new ZoneGang(member.gangId);

                // Store the |zoneGang| for usage by future gang members as well.
                this.gangs_.set(member.gangId, zoneGang);
            }

            zoneGang.addMember(new ZoneMember(zoneGang, member));
        }

        // Determine which sub-set of the |this.gangs_| is considered to be an active gang. This is
        // step (2) of the zone dominance algorithm described in README.md.
        const activeGangIds = new Set();

        for (const zoneGang of this.gangs_.values()) {
            if (zoneGang.size < kZoneDominanceActiveMemberRequirement)
                continue;
            
            activeGangIds.add(zoneGang.id);
        }

        const activeGangDetails = await this.database_.getActiveGangs(activeGangIds);
        for (const details of activeGangDetails) {
            let zoneGang = this.gangs_.get(details.id);
            if (!zoneGang)
                throw new Error('Received information about an unpopulated active gang.');
            
            zoneGang.initialize(details);
        }

        // ...
    }

    dispose() {
        this.gangs_.clear();
        this.gangs_ = null;
    }
}
