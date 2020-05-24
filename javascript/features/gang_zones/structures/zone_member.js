// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Encapsulates the information relevant to an individual gang member who consitutes an "active
// player". The member is always strongly associated with a gang.
export class ZoneMember {
    zoneGang_ = null;

    userId_ = null;
    vip_ = null;

    houses_ = null;

    // Gets the ZoneGang object which this member is a part of.
    get zoneGang() { return this.zoneGang_; }

    // Returns whether this zone member is a VIP on the server.
    isVip() { return !!this.vip_; }

    // Gets the `userId` indicating the user account identifier of this gang member.
    get userId() { return this.userId_; }

    // Gets the houses that are owned by this gang member.
    get houses() { return this.houses_; }

    constructor(zoneGang, member) {
        this.zoneGang_ = zoneGang;

        // TODO: Use |member| as is appropriate.
        this.userId_ = member.userId;
        this.vip_ = member.isVip;

        this.houses_ = new Set();
    }

    // Adds the |houseLocation| as a house owned by this person.
    addHouse(houseLocation) {
        this.houses_.add(houseLocation);
    }

    // Removes the |houseLocation| as a house owned by this person.
    removeHouse(houseLocation) {
        this.houses_.delete(houseLocation);
    }
}
