// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { AbuseDetector } from 'features/abuse/abuse_detector.js';

// The abuse monitor keeps track of instances of abuse across the active players. A series of abuse
// detectors are responsible for detecting it, after which it ends up here for decision making and
// distribution of the knowledge to in-game administrators.
export class AbuseMonitor {
    constructor(announce) {
        this.announce_ = announce;
    }

    // Reports abuse by the given |player|, indicating that they've been observed exercising the
    // |detectedAbuse| with the given level of |certainty|. In-game staff will be informed.
    reportAbuse(player, detectedAbuse, certainty) {
        // TODO: Implement rate limiting of reports.
        // TODO: Implement auto-banning and kicking based on |certainty|.

        switch (certainty) {
            case AbuseDetector.kFunnyFeeling:
                this.announce_().announceToAdministrators(
                    Message.ABUSE_ADMIN_FUNNY_FEELING, player.name, player.id, detectedAbuse);
                break;
            
            case AbuseDetector.kSuspected:
                this.announce_().announceToAdministrators(
                    Message.ABUSE_ADMIN_SUSPECTED, player.name, player.id, detectedAbuse);
                break;
            
            case AbuseDetector.kDetected:
                this.announce_().announceToAdministrators(
                    Message.ABUSE_ADMIN_DETECTED, player.name, player.id, detectedAbuse);
                break;
        }
    }

    dispose() {}
}
