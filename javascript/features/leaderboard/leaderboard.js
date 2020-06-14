// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Feature } from 'components/feature_manager/feature.js';

// The leaderboard feature uses detailed, session-associated statistics to display dynamic and
// running metrics of the individuals and gangs that are most active on Las Venturas Playground. The
// leaderboards are most interesting to fighting players, but we'll cater for the freeroamers too.
export default class Leaderboard extends Feature {
    constructor() {
        super();
    }

    dispose() {

    }
}
