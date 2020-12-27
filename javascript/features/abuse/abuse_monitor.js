// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { AbuseDatabase } from 'features/abuse/abuse_database.js';
import { AbuseDetector } from 'features/abuse/abuse_detector.js';
import { MockAbuseDatabase } from 'features/abuse/mock_abuse_database.js';

import { clone } from 'base/clone.js';
import { format } from 'base/format.js';
import { getComponentName } from 'entities/vehicle_components.js';
import { messages } from 'features/abuse/abuse.messages.js';
import { random } from 'base/random.js';

// The abuse monitor keeps track of instances of abuse across the active players. A series of abuse
// detectors are responsible for detecting it, after which it ends up here for decision making and
// distribution of the knowledge to in-game administrators.
export class AbuseMonitor {
    #announce_ = null;
    #database_ = null;
    #settings_ = null;

    constructor(announce, settings) {
        this.#announce_ = announce;
        this.#settings_ = settings;

        // Create the database instance. A mocked version will be used when running tests.
        this.#database_ = server.isTest() ? new MockAbuseDatabase()
                                          : new AbuseDatabase();

        // Register the ReportAbuse() native, which allows Pawn to detect oddities as well.
        provideNative('ReportAbuse', 'iss', AbuseMonitor.prototype.reportAbusePawn.bind(this));

        // Observe the vehicle manager to learn about illegal component modifications.
        server.vehicleManager.addObserver(this);
    }

    // Reports abuse by the given |player|, indicating that they've been observed exercising the
    // |detectorName| with the given level of |certainty|. In-game staff will be informed.
    reportAbuse(player, detectorName, certainty, evidence) {
        const rid = this.generateUniqueReportId();

        // TODO: Implement auto-banning and kicking based on |certainty|.

        let category = null;
        let message = null;

        switch (certainty) {
            case AbuseDetector.kFunnyFeeling:
                category = 'admin/abuse/monitor';
                message = messages.abuse_admin_monitor;
                break;

            case AbuseDetector.kSuspected:
                category = 'admin/abuse/suspected';
                message = messages.abuse_admin_suspected;
                break;

            case AbuseDetector.kDetected:
                category = 'admin/abuse/detected';
                message = messages.abuse_admin_detected;
                break;

            default:
                throw new Error(`Invalid certainty provided: ${certainty}.`);
        }

        // Broadcast the fact that the |player| has been detected to all in-game administrators.
        this.#announce_().broadcast(category, message, {
            detector: detectorName,
            player, rid,
        });

        // Store the |evidence| in the database, and add more contextual information that will make
        // it easier to look at the incident without being in-game.
        this.#database_.storeEvidence(
            rid, player, detectorName, certainty, this.composeContextualEvidence(player, evidence));
    }

    // Called when abuse is being reported from Pawn, by the |playerid|.
    reportAbusePawn(playerid, detectorName, certainty) {
        const player = server.playerManager.getById(playerid);
        if (!player)
            return 0;  // invalid |playerid| received

        // The setting allows Pawn-based abuse detectors to be muted. We still output information to
        // the console, so that they can be investigated after the fact.
        if (!this.#settings_().getValue('abuse/pawn_based_detectors')) {
            console.log(`[abuse] Detected ${player.name} for ${detectorName}: ${certainty}.`);
            return 0;
        }

        this.reportAbuse(player, detectorName, certainty);
        return 1;
    }

    // ---------------------------------------------------------------------------------------------

    // Generates a unique report ID. This is based on calculating four random bytes and converting
    // them to a string, which gives us 32 bits (16^8) of uniqueness. There might be a couple of
    // duplicates in LVP's lifetime, but this is a substitute for forever incrementing numbers.
    generateUniqueReportId() {
        const bytes = [
            format('%02x', random(0, 256)),
            format('%02x', random(0, 256)),
            format('%02x', random(0, 256)),
            format('%02x', random(0, 256)),
        ];

        return bytes.join('');
    }

    // Composes a contextual evidence object taking |evidence| as the input, and adding on lots of
    // meta-information about the player, there state and whereabouts.
    composeContextualEvidence(player, evidence) {
        const contextualEvidence = clone(evidence) ?? {};
        const position = player.position;

        // (1) Information on where the |player| is in the world.
        contextualEvidence.location = {
            position: [ position.x, position.y, position.z ],
            interiorId: player.interiorId,
            virtualWorld: player.virtualWorld,
        };

        // (2) Information on the state of the player, and what they're currently doing.
        contextualEvidence.state = {
            armour: player.armour,
            health: player.health,
            packetLossPercentage: player.packetLossPercentage,
            ping: player.ping,
            skin: player.skin,
            state: player.state,
            version: player.version,
        };

        // TODO: Add information about the weapons the player currently has.

        return contextualEvidence;
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
