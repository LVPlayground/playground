// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { DetectorManager } from 'features/sampcac/detector_manager.js';
import { DetectorMonitor } from 'features/sampcac/detector_monitor.js';
import { EventMonitor } from 'features/sampcac/event_monitor.js';
import { Feature } from 'components/feature_manager/feature.js';
import { MockSAMPCACNatives } from 'features/sampcac/mock_sampcac_natives.js';
import { SAMPCACNatives } from 'features/sampcac/sampcac_natives.js';

// Base for our integration with the SAMP-CAC anticheat tool, which is optional on Las Venturas
// Playground. Keeps track of whether players have it enabled, and if so, whether they're clean.
export default class SAMPCAC extends Feature {
    detectorMonitor_ = null;
    eventMonitor_ = null;
    natives_ = null;

    constructor() {
        super();

        // This is a low-level feature, as anti-cheat is quite important for the overall gameplay
        // experience, but not quite required at the same level as foundational features.
        this.markLowLevel();

        // Depends on the Abuse feature to route reports through our common reporting infrastructure
        // which includes the ability to record and store evidence.
        const abuse = this.defineDependency('abuse');

        // Automatic detections will share announcements with in-game administrators.
        const announce = this.defineDependency('announce');

        // Native function provider for SAMPCAC. Will be mocked out for testing purposes, as there
        // certainly isn't a connected player while running those.
        this.natives_ = server.isTest() ? new MockSAMPCACNatives()
                                        : new SAMPCACNatives();

        // Manages detectors and their ability to fire for a particular player.
        this.manager_ = new DetectorManager(announce, this.natives_);

        // The detector monitor takes information from other sources and shares it with parties as
        // appropriate, which includes detection of false positives and rate limiting.
        this.detectorMonitor_ = new DetectorMonitor(abuse, this.natives_);

        // The EventMonitor is responsible for monitoring incoming events from SAMPCAC, and to
        // handle them appropriately depending on what they describe.
        this.eventMonitor_ = new EventMonitor(this.manager_, this.detectorMonitor_);
    }

    // ---------------------------------------------------------------------------------------------
    // Public API of the SAMPCAC feature
    // ---------------------------------------------------------------------------------------------

    // Runs the necessary checks on the given |player|, and returns an instance of DetectorResults
    // to communicate back the |player|'s state. Could take multiple seconds.
    async detect(player) { return await this.manager_.detect(player); }

    // Reloads the SAMPCAC detectors without having to reload the entire feature.
    reload() { this.manager_.initializeDetectors(); }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.eventMonitor_.dispose();
        this.eventMonitor_ = null;

        this.detectorMonitor_.dispose();
        this.detectorMonitor_ = null;

        this.manager_.dispose();
        this.manager_ = null;
    }
}
