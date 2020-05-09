// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.
// @ts-check

// Represents a gang zone live on the server. These must only be created by the ZoneCalculator, and
// in tests when exact data is not desirable.
export class Zone {
    zoneGang_ = null;
    areaInfo_ = null;

    constructor(zoneGang, areaInfo) {
        this.zoneGang_ = zoneGang;
        this.areaInfo_ = areaInfo;
    }

    // Gets the area, as a Rect instance, which represents the zone.
    get area() { return this.areaInfo_.area; }

    // Updates the stored area info with the new |info|, which supersedes the current situation.
    update(info) {
        this.areaInfo_ = info;
    }
}
