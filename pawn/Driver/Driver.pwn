// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Returns whether the given |modelId| is a remote controllable vehicle.
stock IsModelRemoteControlVehicle(modelId) {
    switch (modelId) {
        case 441, 464, 465, 501, 564, 594:
            return true;
    }

    return false;
}

// Ejects the given |playerId| from the vehicle they're currently in.
stock EjectPlayerFromVehicle(playerId, Float: offsetZ = 0.5) {
    new Float: position[3];

    GetPlayerPos(playerId, position[0], position[1], position[2]);
    SetPlayerPos(playerId, position[0], position[1], position[2] + offsetZ);
}

public OnPlayerKeyStateChange(playerid, newkeys, oldkeys) {
    // Fix: enables the player to leave remote control vehicles when they're currently in one. This
    // avoids having to listen to the `playerkeystatechange` event in JavaScript.
    if (PRESSED(KEY_SECONDARY_ATTACK)) {
        new const currentVehicle = GetPlayerVehicleID(playerid);
        // Allow the player to leave the vehicle if they're currently in one.
        if (currentVehicle > 0 && currentVehicle != INVALID_VEHICLE_ID) {
            new const currentVehicleModel = GetVehicleModel(currentVehicle);
            if (IsModelRemoteControlVehicle(currentVehicleModel))
                EjectPlayerFromVehicle(playerid);

            return;

        // Allow the player to enter a remote control vehicle if they're near one.
        } else {
            new const kMaximumRemoteVehicleDistance = 2;
            new Float: position[3];

            GetPlayerPos(playerid, position[0], position[1], position[2]);

            new Float: candidateDistance = 9999;
            new candidateVehicleId = INVALID_VEHICLE_ID;

            for (new vehicleId = 0; vehicleId < GetVehiclePoolSize(); ++vehicleId) {
                if (!IsModelRemoteControlVehicle(GetVehicleModel(vehicleId)))
                    continue;  // the vehicle is not remote controllable

                if (!IsVehicleStreamedIn(vehicleId, playerid))
                    continue;  // players cannot enter vehicles they can't see

                new const Float: distance =
                    GetVehicleDistanceFromPoint(vehicleId, position[0], position[1], position[2]);

                if (distance > kMaximumRemoteVehicleDistance)
                    continue;  // the remote controllable vehicle is out of range

                if (distance > candidateDistance)
                    continue;  // a closer vehicle has already been identified

                candidateDistance = distance;
                candidateVehicleId = vehicleId;
            }

            // If a |candidate| has been found, eject the current driver (if any) and then insert
            // the |playerid| to be driving the vehicle instead.
            if (candidateVehicleId != INVALID_VEHICLE_ID) {
                for (new otherPlayerId = 0; otherPlayerId < GetPlayerPoolSize(); ++otherPlayerId) {
                    if (GetPlayerVehicleID(otherPlayerId) != candidateVehicleId)
                        continue;

                    EjectPlayerFromVehicle(otherPlayerId);
                    break;
                }

                PutPlayerInVehicle(playerid, candidateVehicleId, /* driver= */ 0);
                return;
            }
        }
    }

    LegacyPlayerKeyStateChange(playerid, newkeys, oldkeys);
}
