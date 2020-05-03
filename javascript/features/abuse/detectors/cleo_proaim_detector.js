// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { AbuseDetector } from 'features/abuse/abuse_detector.js';

// The maximum ping value at which we'll consider a shot for this detection. [0-#]
const kMaximumPlayerPing = 450;

// The maximum packet loss percentage, until we give up on the player. [0-100]
const kMaximumPlayerPacketLossPercentage = 3;

// Detects the Pro-Aim CLEO hack.
//
// (1) The hack finds the most likely actor the player is aiming at by starting at the crosshair's
//     center, and then iteratively, in 8 unit increments, proceeding to other actors outwards. This
//     assumes at least minimum level of aiming competency on the cheater's side.
//
// (2) If an actor is found, it verifies that they are not driving or dead. It further verifies that
//     there is a clear line of sight between the cheater and the victim. If any of this is not the
//     case, the algorithm will abort.
//
// (3) A bounding box is being drawn on screen. It fluctuates slightly, but the fluctuation is only
//     used aesthetically and does not influence the rest of the algorithm.
//
// (4) When a short is being fired, it calls a method in CCamera at 0x514970, which finds the camera
//     target vector for the local actor. It reduces the Z-coordinate by 0.4 units, and then
//     teleports the local actor to that position by directly writing to the CPed's position vector.
//
// This changes the player's camera position to ~effectively the position where the hit registered.
// We can quite easily detect this, by measuring the distance between the camera position (corrected
// for its front vector) and the position where the hit registered.
//
// This check is quite dependent on network conditions, so exceptions are made for players who have
// very high ping or packet loss percentages, as it would lead to too many false positives.
export class CleoProAimDetector extends AbuseDetector {
    constructor(...params) {
        super(...params, 'CLEO Pro-Aim');
    }

    onPlayerWeaponShot(player, weaponId, hitPosition, { hitPlayer, hitVehicle } = {}) {
        if (player.vehicle !== null || !hitPlayer || !hitPlayer.vehicle !== null)
            return;  // in a vehicle, or a shot on a player in a vehicle

        if (weaponId === /* minigun= */ 38)
            return;  // no point to waste server cycles on a minigun

        if (player.packetLossPercentage > kMaximumPlayerPacketLossPercentage ||
                hitPlayer.packetLossPercentage > kMaximumPlayerPacketLossPercentage) {
            return;  // their packet loss percentage is too high
        }
        
        if (player.ping > kMaximumPlayerPing || hitPlayer.ping > kMaximumPlayerPing)
            return;  // their ping is too high
        
        if (player.isSurfingVehicle())
            return;  // bullet sync is different when surfing on a vehicle
        
        // TODO: Figure out how to identify the teleportations.

        const cameraFrontVector = player.cameraFrontVector;
        const cameraPosition = player.cameraPosition;

        cameraPosition.x += cameraFrontVector.x * 4;
        cameraPosition.y += cameraFrontVector.y * 4;
        cameraPosition.z += cameraFrontVector.z * 4;

        const { source, target } = player.getLastShotVectors();

        console.log('[Distance from target] ' + hitPlayer.position.distanceTo(target));

        const cameraDistance = target.distanceTo(cameraPosition);
        if (cameraDistance >= 1.2)
            return;  // the difference in hit position from the camera vector is too big

        const victimPosition = hitPlayer.position;

        const playerDistance = victimPosition.distanceTo(player.position);
        if (playerDistance <= 4)
            return;  // the players are too close together for detection to be accurate

        const victimPositionOffset = victimPosition.distanceTo(target);
        if (victimPositionOffset <= 4)
            return;

        this.report(player, AbuseDetector.kFunnyFeeling);
    }
}
