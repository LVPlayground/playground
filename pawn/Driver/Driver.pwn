// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Natives provided by the PlaygroundJS plugin.
native ProcessSprayTagForPlayer(playerid);

// Number of milliseconds a player has to be spraying in order to collect a spray tag.
new const kSprayTagTimeMs = 2000;

// Keeps track of when each player started spraying the spray tag, to determine total duration.
new g_sprayTagStartTime[MAX_PLAYERS];

// Returns whether the given |modelId| is a remote controllable vehicle.
IsModelRemoteControlVehicle(modelId) {
    switch (modelId) {
        case 441, 464, 465, 501, 564, 594:
            return true;
    }

    return false;
}

// Ejects the given |playerId| from the vehicle they're currently in.
EjectPlayerFromVehicle(playerId, Float: offsetZ = 0.5) {
    new Float: position[3];

    GetPlayerPos(playerId, position[0], position[1], position[2]);
    SetPlayerPos(playerId, position[0], position[1], position[2] + offsetZ);
}

public OnPlayerConnect(playerid) {
    g_sprayTagStartTime[playerid] = 0;

    // Proceed with legacy processing.
    return PlayerEvents(playerid)->onPlayerConnect();
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

            return 1;

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
                return 1;
            }
        }
    }

    // Driver for the spray tag feature, where a player has to spray tags in order to collect them.
    // This is implemented in Pawn because it requires tracking weapon interaction times.
    if (GetPlayerWeapon(playerid) == WEAPON_SPRAYCAN &&
            GetPlayerVirtualWorld(playerid) == 0 &&
            GetPlayerState(playerid) == PLAYER_STATE_ONFOOT &&
            GetPlayerWeaponState(playerid) != WEAPONSTATE_RELOADING) {
        // If the |player| is currently is pressing the <fire> key, they've started spraying. Record
        // the time. If they've just released the <fire> key, and were spraying for a decent amount
        // of time, it might be time to track that they've been spraying something.
        if(PRESSED(KEY_FIRE)) {
            g_sprayTagStartTime[playerid] = GetTickCount();
        } else if (RELEASED(KEY_FIRE) && g_sprayTagStartTime[playerid] > 0) {
            if ((GetTickCount() - g_sprayTagStartTime[playerid]) > kSprayTagTimeMs) {
                ProcessSprayTagForPlayer(playerid);
            }
            g_sprayTagStartTime[playerid] = 0;
        }
    }

    LegacyPlayerKeyStateChange(playerid, newkeys, oldkeys);
    return 1;
}

// Zone management, powered by the streamer.
public OnPlayerEnterDynamicArea(playerid, STREAMER_TAG_AREA:areaid) {
    ShipManager->onPlayerEnterShip(playerid, areaid);
}

public OnPlayerLeaveDynamicArea(playerid, STREAMER_TAG_AREA:areaid) {
    ShipManager->onPlayerLeaveShip(playerid, areaid);
}

// Define so that JavaScript can intercept the events.
public OnPlayerText(playerid, text[]) {}
public OnPlayerEditDynamicObject(playerid, STREAMER_TAG_OBJECT:objectid, response, Float:x, Float:y, Float:z, Float:rx, Float:ry, Float:rz) {}
public OnPlayerPickUpDynamicPickup(playerid, STREAMER_TAG_PICKUP:pickupid) {}
public OnPlayerSelectDynamicObject(playerid, STREAMER_TAG_OBJECT:objectid, modelid, Float:x, Float:y, Float:z) {}
public OnPlayerShootDynamicObject(playerid, weaponid, STREAMER_TAG_OBJECT:objectid, Float:x, Float:y, Float:z) {}

#if Feature::EnableServerSideWeaponConfig == 0
public OnPlayerUpdate(playerid) { return 1; }
#endif
