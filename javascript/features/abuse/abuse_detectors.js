// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CleoDmageDetector } from 'features/abuse/detectors/cleo_dmage_detector.js';

// Maintains the list of abuse detectors relevant to the server. The `/lvp settings` command can be
// used to enable or disable detectors at runtime, and not all are enabled by default.
export class AbuseDetectors {
    detectors_ = null;
    detectorInfo_ = null;

    settings_ = null;
    monitor_ = null;

    constructor(settings, monitor) {
        this.detectors_ = new Map();
        this.detectorInfo_ = new Map([
            // Setting                                Constructor
            [ 'abuse/detector_cleo_dmage',            CleoDmageDetector ],
        ]);

        this.settings_ = settings;
        this.settings_.addReloadObserver(
            this, AbuseDetectors.prototype.initializeDetectors.bind(this));

        this.monitor_ = monitor;

        this.initializeDetectors();
    }

    // Gets an iterable containing the detectors that are active on the server.
    get activeDetectors() { return this.detectors_.values(); }

    // Gets the number of detectors which have been activated on the server.
    get enabledDetectors() { return this.detectors_.size; }

    // Initializes the abuse detectors. The availability of individual detectors is dependent on
    // the configuration owned by the Settings feature.
    initializeDetectors() {
        for (const setting of this.detectorInfo_.keys()) {
            this.settings_().addSettingObserver(
                setting, this, AbuseDetectors.prototype.onDetectorSettingChange.bind(this));
            
            if (this.settings_().getValue(setting))
                this.onDetectorSettingChange(setting, /* enabled= */ true);
        }
    }

    // Called when the |setting| has changed to |enabled|. The associated abuse detector should
    // either be loaded or unloaded in response to this.
    onDetectorSettingChange(setting, enabled) {
        const DetectorConstructor = this.detectorInfo_.get(setting);
        if (!DetectorConstructor)
            throw new Error('Change event invoked for unknown setting: ' + setting);
        
        if (enabled && !this.detectors_.has(setting)) {
            this.detectors_.set(setting, new DetectorConstructor(this.settings_, this.monitor_));
        } else if (!enabled && this.detectors_.has(setting)) {
            this.detectors_.get(setting).dispose();
            this.detectors_.delete(setting);
        }
    }

    dispose() {
        for (const detector of this.detectors_.values())
            detector.dispose();

        this.detectors_.clear();

        this.settings_.removeReloadObserver();

        for (const setting of this.detectorInfo_.keys())
            this.settings_().removeSettingObserver(setting, this);
    }
}
