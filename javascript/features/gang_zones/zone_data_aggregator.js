// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { ZoneGang } from 'features/gang_zones/structures/zone_gang.js';
import { ZoneMember } from 'features/gang_zones/structures/zone_member.js';

// Set of gang Ids which are persistently granted a zone. The data aggregator will load all their
// settings and details, pass on information to the calculator, but won't fake anything beyond that.
const kPersistentGangIds = new Set([ 1 /* LVP */ ]);

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
    delegate_ = null;

    activeGangs_ = null;
    initialized_ = null;

    constructor(database, gangs, houses, delegate) {
        this.database_ = database;
        this.delegate_ = delegate;

        this.activeGangs_ = new Map();
        this.initialized_ = false;

        this.gangs_ = gangs;
        this.gangs_.addReloadObserver(
            this, ZoneDataAggregator.prototype.onGangsFeatureReload.bind(this));

        this.houses_ = houses;
        this.houses_.addReloadObserver(
            this, ZoneDataAggregator.prototype.onHouseFeatureReload.bind(this));

        // Initialize the event listeners as if the dependencies have reloaded.
        this.onGangsFeatureReload();
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
        const activeGangIds = new Set([...kPersistentGangIds]);

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
    reconsiderGangForZone(zoneGang) {
        if (!this.delegate_)
            return;  // the delegate is optional for testing

        const isActive = zoneGang.members.size >= kZoneDominanceActiveMemberRequirement ||
                         kPersistentGangIds.has(zoneGang.id);

        if (zoneGang.isActive()) {
            if (isActive)
                this.delegate_.onGangUpdated(zoneGang);  // was active, still active
            else
                this.delegate_.onGangDeactivated(zoneGang);  // was active, now inactive
        } else {
            if (isActive)
                this.delegate_.onGangUpdated(zoneGang);  // was inactive, now active
        }

        zoneGang.setActive(isActive);
    }

    // ---------------------------------------------------------------------------------------------
    // Observers: Gangs feature
    // ---------------------------------------------------------------------------------------------

    onGangsFeatureReload() {
        this.gangs_().addObserver(this);
    }

    // Called when a setting of the |gang| has been updated. We make sure that, if there's an active
    // gang, the object reflects the gang's latest configuration.
    onGangSettingUpdated(gang) {
        const activeGang = this.activeGangs_.get(gang.id);
        if (!activeGang || !this.initialized_)
            return;  // the |gang| is not considered to be an active gang
        
        activeGang.initialize(gang);

        // Force an update, as this may indicate that the gang's name, colour or slogan has changed,
        // which are represented in behaviour of the gang zone.
        this.scheduleZoneReconsideration(gang.id);
    }

    // Called when a member of the |gangId| gang has connected with the server.
    onGangMemberConnected(userId, gangId) {
        // There is a possible edge-case where the |userId| was an inactive member of the |gangId|,
        // whose return makes |gangId| an active gang again, potentially even with one or more
        // zones in various areas, which would be player-visible.
        //
        // However, implementing a check for this in a performant way is really, really hard. That's
        // why we don't, and will instead rely on periodic (daily?) refreshes of the data.
    }

    // Called when the given |userId| has joined the gang identified by |gangId|. Their assets will
    // now be considered as part of the gang, which may cause them to become active.
    async onUserJoinGang(userId, gangId, gang) {
        if (!this.initialized_)
            return;  // ignore mutations until the system has initialized

        // (1) Fetch information about all of a gang's active members from the database. Bail out
        //     immediately if this continues to push the gang under the member threshold.
        const activeMembers = await this.database_.getActiveMembers({ gangId });
        if (activeMembers.length < kZoneDominanceActiveMemberRequirement)
            return;

        const zoneGang = new ZoneGang(gangId);
        const zoneMembers = new Map();

        zoneGang.initialize(gang);

        // (2) They have the required number of active members. Excellent. Now clear the cached
        //     gang object and begin building a new one to avoid operating on stale data.
        this.activeGangs_.set(gangId, zoneGang);

        // (3) Add all the gang's active members to the object again.
        for (const member of activeMembers) {
            const zoneMember = new ZoneMember(zoneGang, member);

            zoneMembers.set(member.userId, zoneMember);
            zoneGang.addMember(zoneMember);
        }

        // (4) Identify the houses owned by one of the gang members from the Houses feature, and
        //     add them back directly to the appropriate ZoneMember instance.
        const houseLocations = await this.houses_().getLocations();

        for (const location of houseLocations) {
            if (location.isAvailable())
                continue;  // the house is still available
            
            const locationOwnerId = location.settings.ownerId;
            if (!zoneMembers.has(locationOwnerId))
                continue;  // the person is not a member of this gang
            
            zoneMembers.get(locationOwnerId).addHouse(location);
        }

        this.scheduleZoneReconsideration(gangId);
    }

    // Called when the given |userId| has left the gang identified by |gangId|. If that gang is an
    // active gang, the player leaving might affect their ability to have a zone.
    onUserLeaveGang(userId, gangId) {
        if (!this.initialized_)
            return;  // ignore mutations until the system has initialized
        
        const { activeGang, activeMember } = this.findActiveGangAndMember(gangId, userId);
        if (!activeGang || !activeMember)
            return;  // the player wasn't part of an active gang
        
        activeGang.removeMember(activeMember);

        this.scheduleZoneReconsideration(gangId);
    }

    // ---------------------------------------------------------------------------------------------
    // Observers: House feature
    // ---------------------------------------------------------------------------------------------

    onHouseFeatureReload() {
        this.houses_().addObserver(this);
    }

    // Called when the |location| has been bought by a player. When said player is in a gang, we
    // have to reconsider the gang's areas.
    onHouseCreated(location) {
        if (!this.initialized_ || location.isAvailable())
            return;  // ignore mutations until the system has initialized

        const { activeGang, activeMember } =
            this.findActiveGangAndMember(location.settings.ownerGangId, location.settings.ownerId);

        if (!activeGang || !activeMember)
            return;  // the location wasn't owned by an active gang

        activeMember.addHouse(location);

        this.scheduleZoneReconsideration(location.settings.ownerGangId);
    }

    // Called when the |location| is about to be sold by a player. When said player is in a gang, we
    // have to reconsider the gang's areas.
    onHouseRemoved(location) {
        if (!this.initialized_ || location.isAvailable())
            return;  // ignore mutations until the system has initialized
        
        const { activeGang, activeMember } =
            this.findActiveGangAndMember(location.settings.ownerGangId, location.settings.ownerId);

        if (!activeGang || !activeMember)
            return;  // the location wasn't owned by an active gang

        activeMember.removeHouse(location);

        this.scheduleZoneReconsideration(location.settings.ownerGangId);
    }

    // ---------------------------------------------------------------------------------------------
    
    // Gets the { activeGang, activeMember } for the given |gangId| and |userId|, if any.
    findActiveGangAndMember(gangId, userId) {
        const activeGang = this.activeGangs_.get(gangId);
        if (!activeGang)
            return { activeGang: null, activeMember: null };

        const activeMember = activeGang.members.get(userId);
        if (!activeMember)
            return { activeGang: null, activeMember: null };
        
        return { activeGang, activeMember };
    }

    // Schedules an asynchronous, out-of-bans reconsideration of zoning for the given |gangId|.
    async scheduleZoneReconsideration(gangId) {
        await Promise.resolve();

        if (!this.activeGangs_ || !this.activeGangs_.has(gangId))
            return;
        
        this.reconsiderGangForZone(this.activeGangs_.get(gangId));
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.delegate_ = null;

        this.houses_().removeObserver(this);
        this.houses_.removeReloadObserver(this);

        this.gangs_().removeObserver(this);
        this.gangs_.removeReloadObserver(this);

        this.activeGangs_.clear();
        this.activeGangs_ = null;
    }
}
