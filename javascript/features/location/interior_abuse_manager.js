// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The abuse manager is responsible for determining whether a player is allowed to teleport to or
// from different interiors or safe-zones. This ability might be disabled if they have recently been
// in a fight, which may scare off the property owners.
class InteriorAbuseManager {
    canPlayerTeleport(player) {
        // TODO: Implement similar heuristics to the DamageManager in Pawn here.
        return true;
    }
}

exports = InteriorAbuseManager;
