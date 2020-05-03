// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Encapsulates the information relevant to an individual gang member who consitutes an "active
// player". The member is always strongly associated with a gang.
export class ZoneMember {
    zoneGang_ = null;

    userId_ = null;

    // Gets the ZoneGang object which this member is a part of.
    get zoneGang() { return this.zoneGang_; }

    // Gets the `userId` indicating the user account identifier of this gang member.
    get userId() { return this.userId_; }

    constructor(zoneGang, member) {
        this.zoneGang_ = zoneGang;

        // TODO: Use |member| as is appropriate.
        this.userId_ = member.userId;
    }
}
