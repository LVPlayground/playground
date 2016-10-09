// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Provides the native functions that enable the Abuse feature to be used from Pawn.
class AbuseNatives {
    constructor(abuse) {
        this.abuse_ = abuse;

        provideNative('IsPlayerAllowedToTeleport', 'i',
                      AbuseNatives.prototype.isPlayerAllowedToTeleport.bind(this));
    }

    // ---------------------------------------------------------------------------------------------

    // Returns whether the player having |playerId| is allowed to teleport.
    isPlayerAllowedToTeleport(playerId) {
        const player = server.playerManager.getById(playerId);
        if (!player)
            return 0;  // the |playerId| does not represent a connected player

        return this.abuse_.canTeleport(player) ? 1 : 0;
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        provideNative('IsPlayerAllowedToTeleport', 'i', playerId => 1 /* yes */);
    }
}

exports = AbuseNatives;
