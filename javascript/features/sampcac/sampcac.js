// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { EventMonitor } from 'features/sampcac/event_monitor.js';
import { Feature } from 'components/feature_manager/feature.js';

// Base for our integration with the SAMP-CAC anticheat tool, which is optional on Las Venturas
// Playground. Keeps track of whether players have it enabled, and if so, whether they're clean.
export default class SAMPCAC extends Feature {
    monitor_ = null;

    constructor() {
        super();

        // This is a foundational feature, as anticheat is core to the experience.
        this.markFoundational();

        // The EventMonitor is responsible for monitoring incoming events from SAMPCAC, and to
        // handle them appropriately depending on what they describe.
        this.monitor_ = new EventMonitor();
    }

    dispose() {
        this.monitor_.dispose();
        this.monitor_ = null;
    }
}
