// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import AbuseConstants from 'features/abuse/abuse_constants.js';

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

        switch (teleportStatus.reason) {
            case AbuseConstants.REASON_FIRED_WEAPON:
            case AbuseConstants.REASON_DAMAGE_ISSUED:
            case AbuseConstants.REASON_DAMAGE_TAKEN:
                return TELEPORT_STATUS_REJECTED_FIGHTING;
        }

        if (AbuseConstants.isTimeLimit(teleportStatus.reason))
            return TELEPORT_STATUS_REJECTED_TIME_LIMIT;

        return TELEPORT_STATUS_REJECTED_OTHER;
    }

    // Reports that the |playerId| has been teleported, optionally |timeLimited|.
    reportPlayerTeleport(playerId, timeLimited) {
        const player = server.playerManager.getById(playerId);
        if (!player)
            return;  // the |playerId| does not represent a connected player

        if (timeLimited)
            this.abuse_.reportTimeThrottledTeleport(player);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        provideNative('GetPlayerTeleportStatus', 'ii', (playerId, timeLimited) => 1 /* yes */);
        provideNative('ReportPlayerTeleport', 'ii', (playerId, timeLimited) => 1 /* yes */);
    }
}

export default AbuseNatives;
