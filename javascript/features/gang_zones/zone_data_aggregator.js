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
    houses_ = null;

    activeGangs_ = null;
    initialized_ = null;

    constructor(database, houses) {
        this.database_ = database;

        this.activeGangs_ = new Map();
        this.initialized_ = false;

        this.houses_ = houses;
        this.houses_.addReloadObserver(
            this, ZoneDataAggregator.prototype.onHouseFeatureReload.bind(this));

        // Initialize the event listeners as if the dependencies have reloaded.
        this.onHouseFeatureReload();
    }

    // Gets the map of gangs that are known to the data aggregator.
    get activeGangs() { return this.activeGangs_; }

    // Initialises the initial state of the zone data aggregator, by fetching all active player and
    // gang information from the database, and building an internal cache from that.
    async initialize() {
        const activeMembers = await this.database_.getActiveMembers();
        const activeUsers = new Map();
        
        // Pre-populate our internal knowledge of all active gangs based on the |activeMembers|.
        // This is step (1) of the gang dominance determination algorithm in README.md.
        for (const member of activeMembers) {
            let zoneGang = this.activeGangs_.get(member.gangId);
            if (!zoneGang) {
                zoneGang = new ZoneGang(member.gangId);

                // Store the |zoneGang| for usage by future gang members as well.
                this.activeGangs_.set(member.gangId, zoneGang);
            }

            const zoneMember = new ZoneMember(zoneGang, member);
            
            // Store the |zoneMember| with the |zoneGang|, who owns it.
            zoneGang.addMember(zoneMember);
            
            // Store the |zoneMember| with |activeUsers|, to allow for efficient house allocation.
            activeUsers.set(member.userId, zoneMember);
        }

        // Determine which sub-set of the |this.activeGangs_| is considered to be an active gang.
        // This is step (2) of the zone dominance algorithm described in README.md.
        const activeGangIds = new Set();

        for (const zoneGang of this.activeGangs_.values()) {
            if (zoneGang.size < kZoneDominanceActiveMemberRequirement)
                continue;
            
            activeGangIds.add(zoneGang.id);
        }

        if (!activeGangIds.size)
            return;  // there are no active gangs on the server

        const activeGangDetails = await this.database_.getActiveGangs(activeGangIds);
        for (const details of activeGangDetails) {
            let zoneGang = this.activeGangs_.get(details.id);
            if (!zoneGang)
                throw new Error('Received information about an unpopulated active gang.');
            
            zoneGang.initialize(details);
        }

        // Wait until the Houses feature is loaded, and use its knowledge to build the set of houses
        // owned by gang members. We've got the |activeUsers| map available for quick look-up. This
        // populates the data required to execute step (3) of the zone dominance algorithm.
        const houseLocations = await this.houses_().getLocations();

        for (const location of houseLocations) {
            if (location.isAvailable())
                continue;  // the house is not owned by anyone
            
            const settings = location.settings;

            const zoneMember = activeUsers.get(settings.ownerId);
            if (!zoneMember)
                continue;  // the house is not owned by an active gang member
            
            zoneMember.addHouse(location);
        }

        // Consider every gang in |this.activeGangs_| for a gang zone now that initial data has been
        // gathered. That function will make the next set of determinations.
        for (const zoneGang of this.activeGangs_.values())
            await this.reconsiderGangForZone(zoneGang);

        this.initialized_ = true;
    }

    // Considers the |zoneGang| for getting a gang zone based on their data. Can be called any time
    // the details in |zoneGang| are updated, for example with new or removed members, house changes
    // or member activity changes e.g. because a previously inactive member connects to the server.
    async reconsiderGangForZone(zoneGang) {

    }

    // ---------------------------------------------------------------------------------------------
    // Observers: House feature
    // ---------------------------------------------------------------------------------------------

    onHouseFeatureReload() {
        this.houses_().addObserver(this);
    }

    onHouseCreated(location) {
        if (!this.initialized_ || location.isAvailable())
            return;  // ignore mutations until the system has initialized

        const activeGang = this.activeGangs_.get(location.settings.ownerGangId);
        if (!activeGang)
            return;  // the trade wasn't initiated by a member of an active gang

        const activeMember = activeGang.members.get(location.settings.ownerId);
        if (!activeMember)
            return;  // the owner isn't an active member of the gang -- should never happen!

        activeMember.addHouse(location);

        // Asynchronously reconsider the |activeGang| for a zone, we don't want to interfere with
        // the execution and/or stack traces of the House feature more than we have to.
        wait(0).then(() => this.reconsiderGangForZone(activeGang));
    }

    onHouseRemoved(location) {
        if (!this.initialized_ || location.isAvailable())
            return;  // ignore mutations until the system has initialized
        
        const activeGang = this.activeGangs_.get(location.settings.ownerGangId);
        if (!activeGang)
            return;  // the trade wasn't initiated by a member of an active gang
        
        const activeMember = activeGang.members.get(location.settings.ownerId);
        if (!activeMember)
            return;  // the owner isn't an active member of the gang -- should never happen!
        
        activeMember.removeHouse(location);

        // Asynchronously reconsider the |activeGang| for a zone, we don't want to interfere with
        // the execution and/or stack traces of the House feature more than we have to.
        wait(0).then(() => this.reconsiderGangForZone(activeGang));
    }

    // ---------------------------------------------------------------------------------------------
    
    dispose() {
        this.houses_().removeObserver(this);
        this.houses_.removeReloadObserver(this);

        this.activeGangs_.clear();
        this.activeGangs_ = null;
    }
}
