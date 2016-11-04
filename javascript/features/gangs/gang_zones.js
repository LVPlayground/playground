// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Responsible for managing the gang zones visible on the map.
//
// Gangs that have a certain penetration in a given area will have the area awarded as their zone.
// The gang zone will be displayed on each player's minimap in the gang's colour. The gang zone's
// area will be influenced by the value of the created houses and the residential value.
class GangZones {
    constructor(manager, settings) {
        this.manager_ = manager;

        this.settings_ = settings;
    }

    dispose() {}
}

exports = GangZones;
