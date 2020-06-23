// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { AbuseDetectors } from 'features/abuse/abuse_detectors.js';
import { AbuseMonitor } from 'features/abuse/abuse_monitor.js';
import { Feature } from 'components/feature_manager/feature.js';

// Implementation of the feature that keep track of whether a player is abusing. It tracks the
// fighting activities of a player and applies limitations based on area policies.
export default class Abuse extends Feature {
    detectors_ = null;
    monitor_ = null;

    constructor() {
        super();

        // The announce feature enables abuse to be reported to administrators.
        const announce = this.defineDependency('announce');

        // The settings for the Abuse system are configurable at runtime.
        const settings = this.defineDependency('settings');

        this.monitor_ = new AbuseMonitor(announce, settings);
        this.detectors_ = new AbuseDetectors(settings, this.monitor_);
    }

    dispose() {
        this.detectors_.dispose();
        this.detectors_ = null;

        this.monitor_.dispose();
        this.monitor_ = null;
    }
}
