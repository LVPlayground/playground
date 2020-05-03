// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { AbuseDetector } from 'features/abuse/abuse_detector.js';

// Detects illegal vehicle entry.
//
// We have the ability to lock vehicles on the server, which means that only certain players are
// able to access them. This is useful to, for example, limit certain vehicles to administrators.
//
// There are various cheats around that enable players to enter locked cars regardless by disabling
// the GTA: San Andreas checks that prohibit them from doing so. Detecting this is straightforward,
// and foolproof given that we have definitive knowledge.
//
// When detected, the one thing to keep in mind is that there is a slight possibility of server
// bugs: the player might not have received the locking instruction. This, in practice, has not
// happened since at least 2014.
export class IllegalVehicleEntryDetector extends AbuseDetector {
    constructor(...params) {
        super(...params, 'illegal vehicle entry');
    }

    onPlayerEnterVehicle(player, vehicle) {
        if (vehicle.isLockedForPlayer(player))
            this.report(player, AbuseDetector.kDetected);
    }
}
