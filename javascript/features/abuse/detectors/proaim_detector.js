// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { AbuseDetector } from 'features/abuse/abuse_detector.js';

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
export class ProAimDetector extends AbuseDetector {
    constructor(...params) {
        super(...params, 'Pro-Aim CLEO');
    }

    onPlayerWeaponShot(player, weaponId, hitPosition, { hitPlayer, hitVehicle } = {}) {

    }
}
