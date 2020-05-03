// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Encapsulates the information the `gang_zones` feature maintains about an individual gang. This is
// information that's not necessarily aligned with the gangs that are available in-game. 
export class ZoneGang {
    id_ = null;

    active_ = null;
    members_ = null;

    // Gets the ID describing how this gang has been represented in the database.
    get id() { return this.id_; }

    // Gets the size of this gang in regards of active members.
    get size() { return this.members_.size; }

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
        
        // TODO: Do something with the given |details|.
        
        this.active_ = true;
    }

    // Adds the given |zoneMember| to the list of active members who are part of this gang. We use a
    // mapping of userId to ZoneMember instance to optimise for runtime manipulation.
    addMember(zoneMember) {
        this.members_.set(zoneMember.userId, zoneMember);
    }
}
