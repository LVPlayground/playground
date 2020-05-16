// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { BarrelTracker } from 'features/red_barrels/barrel_tracker.js';
import Feature from 'components/feature_manager/feature.js';

// Implementation of the Red Barrels feature, which scatters a series of barrels throughout San
// Andreas that players can "collect" by blowing them up.
export default class RedBarrels extends Feature {
    tracker_ = null;

    constructor() {
        super();

        // Loads, and has knowledge of all the individual barrels.
        this.tracker_ = new BarrelTracker();
    }

    dispose() {}
}
