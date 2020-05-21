// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Feature } from 'components/feature_manager/feature.js';
import { CruiseCommands } from 'features/cruise/cruise_commands.js';
import { CruiseManager } from 'features/cruise/cruise_manager.js';

// Cruises are an enjoyable element in LVP for, especially, freeroamers
export class Cruise extends Feature {
    constructor() {
        super();

        // Be able to send a certain message to a certain public
        const announce = this.defineDependency('announce');

        this.manager_ = new CruiseManager(announce);
        this.commands_ = new CruiseCommands(this.manager_);
    }

    dispose() {
        this.commands_.dispose();
        this.commands_ = null;

        this.manager_.dispose();
        this.manager_ = null;
    }
}
