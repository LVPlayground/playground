// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { AbuseDetectors } from 'features/abuse/abuse_detectors.js';
import { AbuseEventListener } from 'features/abuse/abuse_event_listener.js';
import AbuseMitigator from 'features/abuse/abuse_mitigator.js';
import { AbuseMonitor } from 'features/abuse/abuse_monitor.js';
import AbuseNatives from 'features/abuse/abuse_natives.js';
import { Feature } from 'components/feature_manager/feature.js';

// Time period, in milliseconds, a player needs to wait between time limited teleportations.
const TeleportCoolDownPeriodMs = 180000;  // 3 minutes

// Implementation of the feature that keep track of whether a player is abusing. It tracks the
// fighting activities of a player and applies limitations based on area policies.
class Abuse extends Feature {
    constructor() {
        super();

        // The announce feature enables abuse to be reported to administrators.
        this.announce_ = this.defineDependency('announce');

        // The settings for the Abuse system are configurable at runtime.
        this.settings_ = this.defineDependency('settings');

        this.mitigator_ = new AbuseMitigator();
        this.monitor_ = new AbuseMonitor(this.announce_, this.settings_);
        this.detectors_ = new AbuseDetectors(this.settings_, this.monitor_);

        // Responsible for listening to SA-MP events and forwarding those to the mitigator and
        // enabled abuse detectors. Does minimal pre-processing itself.
        this.eventListener_ = new AbuseEventListener(this.mitigator_, this.detectors_);

        this.natives_ = new AbuseNatives(this);
    }

    // Gets the value of the setting in the `abuse` category named |name|.
    getSetting(name) { return this.settings_().getValue('abuse/' + name); }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.natives_.dispose();
        this.natives_ = null;

        this.eventListener_.dispose();
        this.eventListener_ = null;

        this.monitor_.dispose();
        this.monitor_ = null;

        this.mitigator_.dispose();
        this.mitigator_ = null;
    }
}

export default Abuse;
