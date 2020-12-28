// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Feature } from 'components/feature_manager/feature.js';
import { SpawnArmourManager } from 'features/spawn_armour/spawn_armour_manager.js';

export default class SpawnArmour extends Feature {
    constructor() {
        super();

        // Depends on the Settings feature for configurability of spawn armour duration.
        const settings = this.defineDependency('settings');
        const announce = this.defineDependency('announce');

        this.manager_ = new SpawnArmourManager(settings, announce);
    }

    dispose() {
        this.manager_.dispose();
        this.manager_ = null;
    }
}