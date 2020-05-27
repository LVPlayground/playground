// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

new const Float: kPacketLossThreshold = 0.63;
new const Float: kVictimDistanceThreshold = 3.0;
new const kSuspicionTreshold = 3;

// Number of times that a particular player has been suspected for aimbot usage.
new g_aimbotSuspicionCount[MAX_PLAYERS];

DetectAimbotOnWeaponShot(playerid, hittype, hitid) {
    if (hittype != BULLET_HIT_TYPE_PLAYER)
        return;

    if (IsPlayerInAnyVehicle(playerid) || IsPlayerInAnyVehicle(hitid))
        return;

    if (GetPlayerSurfingVehicleID(playerid) != INVALID_VEHICLE_ID ||
            GetPlayerSurfingVehicleID(hitid) != INVALID_VEHICLE_ID) {
        return;
    }

    new const Float: playerPacketLoss = NetStats_PacketLossPercent(playerid);
    new const Float: victimPacketLoss = NetStats_PacketLossPercent(hitid);

    if (playerPacketLoss >= kPacketLossThreshold || victimPacketLoss >= kPacketLossThreshold)
        return;

    new Float: origin[3];
    new Float: target[3];

    GetPlayerLastShotVectors(
        playerid, origin[0], origin[1], origin[2], target[0], target[1], target[2]);

    if (IsPlayerInRangeOfPoint(hitid, kVictimDistanceThreshold, target[0], target[1], target[2])) {
        g_aimbotSuspicionCount[playerid] = max(g_aimbotSuspicionCount[playerid] - 1, 0);
    } else if (++g_aimbotSuspicionCount[playerid] > kSuspicionTreshold) {
        ReportAbuse(playerid, "aimbot", "monitor");
    }
}
