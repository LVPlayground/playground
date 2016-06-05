// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Feature = require('components/feature_manager/feature.js');

// The location feature encapsulates capabilities related to a player's location: interior handling,
// teleportation, informational commands and so on.
class Location extends Feature {
    constructor() {
        super();
    }

    dispose() {

    }
}

exports = Location;
