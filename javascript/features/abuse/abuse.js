// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { AbuseDetectors } from 'features/abuse/abuse_detectors.js';
import { AbuseDetector } from 'features/abuse/abuse_detector.js';
import { AbuseMonitor } from 'features/abuse/abuse_monitor.js';
import { Feature } from 'components/feature_manager/feature.js';

// Implementation of the feature that keep track of whether a player is abusing. It tracks the
// fighting activities of a player and applies limitations based on area policies.
export default class Abuse extends Feature {
    detectors_ = null;
    monitor_ = null;

    constructor() {
        super();

        // The ability to report and share player abuse is deemed a low-level capability.
        this.markLowLevel();

        // The announce feature enables abuse to be reported to administrators.
        const announce = this.defineDependency('announce');

        // The settings for the Abuse system are configurable at runtime.
        const settings = this.defineDependency('settings');

        this.monitor_ = new AbuseMonitor(announce, settings);
        this.detectors_ = new AbuseDetectors(settings, this.monitor_);
    }

    // ---------------------------------------------------------------------------------------------
    // Public API of the Abuse feature
    // ---------------------------------------------------------------------------------------------

    // Levels of certainty that can be awarded to reports.
    static kFunnyFeeling = AbuseDetector.kFunnyFeeling;
    static kSuspected = AbuseDetector.kSuspected;
    static kDetected = AbuseDetector.kDetected;

    // Reports that the given |player| has been detected for the given |detectorName|. A certainty
    // level will be included, which must be one of the constants above. Optionally the |evidence|
    // can be given, which can be any JSON-serializable piece of data.
    reportAbuse(player, detectorName, certainty, evidence = null) {
        this.monitor_.reportAbuse(player, detectorName, certainty, evidence);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.detectors_.dispose();
        this.detectors_ = null;

        this.monitor_.dispose();
        this.monitor_ = null;
    }
}
