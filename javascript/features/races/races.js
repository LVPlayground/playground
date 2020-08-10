// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Feature } from 'components/feature_manager/feature.js';
import { RaceRegistry } from 'features/races/race_registry.js';

// The Races feature is responsible for providing the race interface on the server. It builds on top
// of the Games API, for ensuring consistent behaviour of games on the server.
export default class Races extends Feature {
    registry_ = null;

    constructor() {
        super();

        // The registry is responsible for keeping tabs on the available races.
        this.registry_ = new RaceRegistry();
    }

    // ---------------------------------------------------------------------------------------------
    // The races feature does not define a public API.
    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.registry_.dispose();
        this.registry_ = null;
    }
}
