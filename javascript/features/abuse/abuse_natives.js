// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const TELEPORT_STATUS_ALLOWED = 0;
const TELEPORT_STATUS_REJECTED_FIGHTING = 1;
const TELEPORT_STATUS_REJECTED_TIME_LIMIT = 2;
const TELEPORT_STATUS_REJECTED_OTHER = 3;

// Provides the native functions that enable the Abuse feature to be used from Pawn.
class AbuseNatives {
    constructor(abuse) {
        this.abuse_ = abuse;

        provideNative(
            'GetPlayerTeleportStatus', 'ii', AbuseNatives.prototype.playerTeleportStatus.bind(this))

        provideNative(
            'ReportPlayerTeleport', 'ii', AbuseNatives.prototype.reportPlayerTeleport.bind(this));
    }

    // ---------------------------------------------------------------------------------------------

    // Returns whether the player having |playerId| is allowed to teleport.
    playerTeleportStatus(playerId, timeLimited) {
        const player = server.playerManager.getById(playerId);
        if (!player)
            return TELEPORT_STATUS_REJECTED_OTHER;

        const teleportStatus = this.abuse_.canTeleport(player, { enforceTimeLimit: !!timeLimited });
        if (teleportStatus.allowed)
            return TELEPORT_STATUS_ALLOWED;

        // TODO: Tell Pawn about more detailed failure statuses.
        return TELEPORT_STATUS_REJECTED_FIGHTING;
    }

    // Reports that the |playerId| has been teleported, optionally |timeLimited|.
    reportPlayerTeleport(playerId, timeLimited) {
        const player = server.playerManager.getById(playerId);
        if (!player)
            return;  // the |playerId| does not represent a connected player

        this.abuse_.reportTeleport(player, { timeLimited: !!timeLimited });
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        provideNative('GetPlayerTeleportStatus', 'ii', (playerId, timeLimited) => 1 /* yes */);
        provideNative('ReportPlayerTeleport', 'ii', (playerId, timeLimited) => 1 /* yes */);
    }
}

exports = AbuseNatives;
