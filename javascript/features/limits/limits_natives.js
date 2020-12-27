// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Provides native functions specific to the Limits value, enabling Pawn code to participate in the
// decisions. Natives should be proactively removed when there is no further need.
export class LimitsNatives {
    feature_ = null;

    constructor(feature) {
        this.feature_ = feature;

        provideNative(
            'CanPlayerTeleport', 'i', LimitsNatives.prototype.canPlayerTeleport.bind(this));
        provideNative(
            'ReportPlayerTeleport', 'i', LimitsNatives.prototype.reportPlayerTeleport.bind(this));
    }

    // native CanPlayerTeleport(playerid);
    //
    // Returns whether the given |playerId| is allowed to teleport right now. Time throttles will
    // be ignored, but all other requirements will be tested.
    canPlayerTeleport(playerId) {
        const player = server.playerManager.getById(playerId);
        if (!player)
            return 0;  // invalid |playerId|, they might've just disconnected

        return this.feature_.canTeleport(player, /* disableThrottle= */ true).isApproved() ? 1 : 0;
    }

    // native ReportPlayerTeleport(playerid);
    //
    // Reports the |playerId| as having just teleported. This will reset the throttle timers for
    // their account, at least until they respawn.
    reportPlayerTeleport(playerId) {
        const player = server.playerManager.getById(playerId);
        if (!player)
            return 0;  // invalid |playerId|, they might've just disconnected
        
        this.feature_.reportTeleportation(player);
    }

    dispose() {
        provideNative('ReportPlayerTeleport', 'i', () => 1);
        provideNative('CanPlayerTeleport', 'i', () => 1);
    }
}
