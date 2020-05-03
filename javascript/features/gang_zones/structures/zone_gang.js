// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Default color that will be given to gangs who don't explicitly set their own color.
export const kDefaultGangColor = Color.fromRGB(0xB0, 0xBE, 0xC5);

// Encapsulates the information the `gang_zones` feature maintains about an individual gang. This is
// information that's not necessarily aligned with the gangs that are available in-game. 
export class ZoneGang {
    id_ = null;

    active_ = null;
    members_ = null;

    color_ = null;
    name_ = null;

    // Gets the ID describing how this gang has been represented in the database.
    get id() { return this.id_; }

    // Gets the members of this gang who are considered to be active.
    get members() { return this.members_; }

    // Gets the color of this gang. Only available for active gangs.
    get color() { return this.color_; }

    // Gets the name of this gang. Only available for active gangs.
    get name() { return this.name_; }

    // Returns whether this instance represents an "active gang".
    isActive() { return this.active_; }

    constructor(id) {
        this.id_ = id;

        this.active_ = false;
        this.members_ = new Map();
    }

    // Initializes this ZoneGang with the given |details|. The structure of this object must match
    // the Gang object defined in //features/gangs/gang.js, even when sourced from the database. The
    // call to `initialize()` is only necessary for gangs that are to become active.
    initialize(details) {
        if (details.id !== this.id_)
            throw new Error(`Cannot initialize gang ${this.id_} with data from gang ${details.id}`);

        this.color_ = details.color || kDefaultGangColor;
        this.name_ = details.name;
    }

    // Updates whether the gang is considered to be active. Should only be set by the zone data
    // aggregator as it's its job to determine this.
    setActive(active) {
        this.active_ = active;
    }

    // Adds the given |zoneMember| to the list of active members who are part of this gang. We use a
    // mapping of userId to ZoneMember instance to optimise for runtime manipulation.
    addMember(zoneMember) {
        this.members_.set(zoneMember.userId, zoneMember);
    }

    // Removes the given |zoneMember| from the list of active members.
    removeMember(zoneMember) {
        this.members_.delete(zoneMember.userId);
    }
}
