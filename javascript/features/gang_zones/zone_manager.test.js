// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.
// @ts-check

import { ZoneManager } from 'features/gang_zones/zone_manager.js';

describe('ZoneManager', (it, beforeEach, afterEach) => {
    /**
     * @type ZoneManager
     */
    let manager = null;

    beforeEach(() => {
        manager = new ZoneManager();
    });

    afterEach(() => manager.dispose());
});
