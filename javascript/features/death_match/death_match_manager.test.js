// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { DeathMatchManger } from "features/death_match/death_match_manager.js";

describe('DeathMatchManager', (it, beforeEach) => {
    let manager = null;

    beforeEach(async => {
        
        const abuse = server.featureManager.getFeatureForTests('abuse');
        manager = new DeathMatchManger(abuse);
    });

});