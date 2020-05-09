// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The ZoneManager receives updates from the ZoneCalculator whenever a gang zone has to be created,
// removed, or amended based on changes in gangs, their members and/or their houses.
export class ZoneManager {
    constructor() {}

    // ---------------------------------------------------------------------------------------------

    // Called when the given |zone| should be created on the server.
    createZone(zone) {}

    // Called when the given |zone| should be updated. This generally means that its size of colour
    // changed, and the visual appearance should be updated to match.
    updateZone(zone) {}

    // Called when the given |zone| should be deleted from the map.
    deleteZone(zone) {}

    // --------------------------------------------------------------------------------------------

    dispose() {}
}
