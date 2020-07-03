// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { AbuseDatabase } from 'features/abuse/abuse_database.js';
import { AbuseDetector } from 'features/abuse/abuse_detector.js';

import { getComponentName } from 'entities/vehicle_components.js';

// The abuse monitor keeps track of instances of abuse across the active players. A series of abuse
// detectors are responsible for detecting it, after which it ends up here for decision making and
// distribution of the knowledge to in-game administrators.
export class AbuseMonitor {
    constructor(announce, settings) {
        this.announce_ = announce;
        this.database_ = new AbuseDatabase();
        this.settings_ = settings;

        provideNative('ReportAbuse', 'iss', AbuseMonitor.prototype.reportAbusePawn.bind(this));

        server.vehicleManager.addObserver(this);
    }

    // Reports abuse by the given |player|, indicating that they've been observed exercising the
    // |detectorName| with the given level of |certainty|. In-game staff will be informed.
    reportAbuse(player, detectorName, certainty, evidence) {
        // TODO: Implement rate limiting of reports.
        // TODO: Implement auto-banning and kicking based on |certainty|.

        switch (certainty) {
            case AbuseDetector.kFunnyFeeling:
                this.announce_().announceToAdministrators(
                    Message.ABUSE_ADMIN_FUNNY_FEELING, player.name, player.id, detectorName);
                break;
            
            case AbuseDetector.kSuspected:
                this.announce_().announceToAdministrators(
                    Message.ABUSE_ADMIN_SUSPECTED, player.name, player.id, detectorName);
                break;
            
            case AbuseDetector.kDetected:
                this.announce_().announceToAdministrators(
                    Message.ABUSE_ADMIN_DETECTED, player.name, player.id, detectorName);
                break;
        }

        if (!server.isTest() && evidence)
            this.database_.storeEvidence({ player, detectorName, certainty, evidence });
    }

    // Called when abuse is being reported from Pawn, by the |playerid|.
    reportAbusePawn(playerid, detectorName, certainty) {
        const player = server.playerManager.getById(playerid);
        if (!player)
            return 0;  // invalid |playerid| received
        
        // The setting allows Pawn-based abuse detectors to be muted. We still output information to
        // the console, so that they can be investigated after the fact.
        if (!this.settings_().getValue('abuse/pawn_based_detectors')) {
            console.log(`[abuse] Detected ${player.name} for ${detectorName}: ${certainty}.`);
            return 0;
        }

        this.reportAbuse(player, detectorName, certainty);
        return 1;
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the |player| has made an illegal vehicle modification. This could be used to
    // crash other players on the server, and thus is considered certain abuse.
    onVehicleIllegalModification(player, vehicle, componentId) {
        // (1) Report abuse for the |player|.
        this.reportAbuse(player, 'illegal vehicle modification', AbuseDetector.kDetected, {
            vehicleModelId: vehicle.modelId,
            vehicleModelName: vehicle.model.name,
            vehicleComponentId: componentId,
            vehicleComponentName: getComponentName(componentId),
        });

        // (2) Immediately, without delay, remove the |player| from the server.
        player.kick();
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.vehicleManager.removeObserver(this);

        provideNative('ReportAbuse', 'iss', (playerid, detectorName, certainty) => 0);
    }
}
