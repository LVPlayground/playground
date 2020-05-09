// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.
// @ts-check

// The alpha channel value for each of the gang zones drawn on the map.
const kGangZoneAlphaChannel = 0xA0;

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

    // Gets the colour in which this gang zone should be drawn on the map.
    get color() { return this.zoneGang_.color.withAlpha(kGangZoneAlphaChannel); }

    // Gets the ID of the gang who owns this gang zone.
    get gangId() { return this.zoneGang_.id; }

    // Gets the name of the gang who owns this gang zone.
    get gangName() { return this.zoneGang_.name; }

    // Updates the stored area info with the new |info|, which supersedes the current situation.
    update(info) {
        this.areaInfo_ = info;
    }
}
