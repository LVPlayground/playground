// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

new const Float: kCameraVectorMultiplier = 4.0;
new const Float: kPacketLossThreshold = 0.63;
new const Float: kVictimDistanceThreshold = 3.0;
new const kSuspicionTreshold = 3;

// Number of times that a particular player has been suspected for aimbot usage.
new g_aimbotSuspicionCount[MAX_PLAYERS];

DetectAbuseOnWeaponShot(playerid, hittype, hitid) {
    if (hittype != BULLET_HIT_TYPE_PLAYER || IsPlayerNPC(hitid))
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
        return;
    }

    new Float: position[3];
    new Float: victimPosition[3];

    GetPlayerPos(playerid, position[0], position[1], position[2]);
    GetPlayerPos(hitid, victimPosition[0], victimPosition[1], victimPosition[2]);

    new const Float: playerVictimDistance =
        VectorSize(position[0] - victimPosition[0],
                   position[1] - victimPosition[1],
                   position[2] - victimPosition[2]);

    if (playerVictimDistance <= 4.0 || playerVictimDistance >= 300.0)
        return;  // the |playerid| and |hitid| are too close together

    new const Float: targetVictimDistance =
        VectorSize(target[0] - victimPosition[0],
                   target[1] - victimPosition[1],
                   target[2] - victimPosition[2]);

    if (targetVictimDistance < 4.0)
        return;  // the |playerid| actually hit pretty close to the |hitid|

    new Float: cameraPosition[3];
    new Float: cameraFrontVector[3];

    GetPlayerCameraPos(playerid, cameraPosition[0], cameraPosition[1], cameraPosition[2]);
    GetPlayerCameraFrontVector(
        playerid, cameraFrontVector[0], cameraFrontVector[1], cameraFrontVector[2]);

    new Float: aimRadius[3];

    aimRadius[0] = cameraPosition[0] + cameraFrontVector[0] * kCameraVectorMultiplier;
    aimRadius[1] = cameraPosition[1] + cameraFrontVector[0] * kCameraVectorMultiplier;
    aimRadius[2] = cameraPosition[2] + cameraFrontVector[0] * kCameraVectorMultiplier;

    new const Float: aimOffset =
        VectorSize(target[0] - aimRadius[0],
                   target[1] - aimRadius[1],
                   target[2] - aimRadius[2]);

    if (aimOffset >= 1.20)
        return;  // the aim offset is fine

    ReportAbuse(playerid, "CLEO ProAim", "monitor");
}
