// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Natives provided by the PlaygroundJS plugin.
native ProcessSprayTagForPlayer(playerid);
native ReportAbuse(playerid, detectorName[], certainty[]);

#include "Driver/Abuse/WeaponShotDetection.pwn"

// The keys that have to be pressed by the player to activate certain vehicle key effects. These
// have been carried over from the SAS gamemode by leaty, Lithirm and Kase.
#define VEHICLE_KEYS_BINDING_BOOST          KEY_ACTION
#define VEHICLE_KEYS_BINDING_COLOUR         KEY_ANALOG_LEFT
#define VEHICLE_KEYS_BINDING_FIX            KEY_SUBMISSION
#define VEHICLE_KEYS_BINDING_FLIP           KEY_ANALOG_RIGHT
#define VEHICLE_KEYS_BINDING_JUMP           KEY_CROUCH
#define VEHICLE_KEYS_BINDING_NOS            KEY_FIRE
#define VEHICLE_KEYS_BINDING_BLINKER_RIGHT  KEY_LOOK_RIGHT
#define VEHICLE_KEYS_BINDING_BLINKER_LEFT   KEY_LOOK_LEFT

// Number of milliseconds a player has to be spraying in order to collect a spray tag.
new const kSprayTagTimeMs = 2000;

// Keeps track of the last vehicle they entered, and hijacked, to work around "ninja jack" kills.
new g_ninjaJackCurrentVehicleId[MAX_PLAYERS];
new g_ninjaJackLastAttemptTime[MAX_PLAYERS];
new g_ninjaJackLastAttemptVictim[MAX_PLAYERS];

// Keeps track of when each player started spraying the spray tag, to determine total duration.
new g_sprayTagStartTime[MAX_PLAYERS];

// Time at which the player last used the boost Vehicle Keys feature.
new g_vehicleKeysLastBoost[MAX_PLAYERS];

// The four blinker objects for the player. 0/1 = RIGHT 2/3 = LEFT
new DynamicObject: g_blinkerObjects[MAX_PLAYERS][4];

// Returns whether the given |modelId| is a remote controllable vehicle.
IsModelRemoteControlVehicle(modelId) {
    switch (modelId) {
        case 441, 464, 465, 501, 564, 594:
            return true;
    }

    return false;
}

// Gets the ID of the player who is currently driving the given |vehicleId|.
GetVehicleDriverID(vehicleId) {
    for (new playerId = 0; playerId < GetPlayerPoolSize(); ++playerId) {
        if (GetPlayerVehicleID(playerId) != vehicleId)
            continue;  // the |playerId| is not in the |vehicleId|

        if (GetPlayerVehicleSeat(playerId) != 0)
            continue;  // the |playerId| is not driving that vehicle

        return playerId;
    }

    return INVALID_PLAYER_ID;
}

// Ejects the given |playerId| from the vehicle they're currently in.
EjectPlayerFromVehicle(playerId, Float: offsetZ = 0.5) {
    new Float: position[3];

    GetPlayerPos(playerId, position[0], position[1], position[2]);
    SetPlayerPos(playerId, position[0], position[1], position[2] + offsetZ);
}

public OnPlayerConnect(playerid) {
    g_aimbotSuspicionCount[playerid] = 0;
    g_sprayTagStartTime[playerid] = 0;

    // Proceed with legacy processing.
    return PlayerEvents(playerid)->onPlayerConnect();
}

public OnPlayerDisconnect(playerid, reason) {
    StopBlinking(playerid);

    // Proceed with legacy processing.
    return PlayerEvents(playerid)->onPlayerDisconnect(reason);
}

// Returns whether vehicle keys are available to the |playerid|, based on their current state.
bool: AreVehicleKeysAvailable(playerid) {
    return !PlayerSyncedData(playerid)->hasMinigameName() &&
           !PlayerActivity(playerid)->isJavaScriptActivity() &&
           !IsPlayerInMinigame(playerid);
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
                new const currentDriverId = GetVehicleDriverID(candidateVehicleId);
                if (currentDriverId != INVALID_PLAYER_ID)
                    EjectPlayerFromVehicle(currentDriverId);

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

    // Implementation of the vehicle keys, that can be enabled for players when they achieve certain
    // achievements. The exact requirements are documented elsewhere.
    if (PlayerSyncedData(playerid)->vehicleKeys() > 0 && AreVehicleKeysAvailable(playerid)) {
        new const vehicleId = GetPlayerVehicleID(playerid);
        new const vehicleKeys = PlayerSyncedData(playerid)->vehicleKeys();

        // Vehicle keys (1): speed boost
        if (HOLDING(VEHICLE_KEYS_BINDING_BOOST) && (vehicleKeys & VEHICLE_KEYS_BOOST)) {
            new const boostLimitMs = 1250;
            new const Float: boost = 2;

            new Float: velocity[3];

            new const currentTime = GetTickCount();
            if (g_vehicleKeysLastBoost[playerid] <= (currentTime - boostLimitMs)) {
                g_vehicleKeysLastBoost[playerid] = currentTime;

                GetVehicleVelocity(vehicleId, velocity[0], velocity[1], velocity[2]);
                SetVehicleVelocity(
                    vehicleId, velocity[0] * boost, velocity[1] * boost, velocity[2] * boost);
            }
        }

        // Vehicle keys (2): colour change
        if (HOLDING(VEHICLE_KEYS_BINDING_COLOUR) && (vehicleKeys & VEHICLE_KEYS_COLOUR)) {
            new primaryColour = random(126);
            new secondaryColour = random(126);

            ChangeVehicleColor(vehicleId, primaryColour, secondaryColour);
        }

        // Vehicle keys (3): full repair
        if (HOLDING(VEHICLE_KEYS_BINDING_FIX) && (vehicleKeys & VEHICLE_KEYS_FIX)) {
            RepairVehicle(vehicleId);

            GameTextForPlayer(playerid, "FIXED", 1000, 3);
        }

        // Vehicle keys (4): flip
        if (HOLDING(VEHICLE_KEYS_BINDING_FLIP) && (vehicleKeys & VEHICLE_KEYS_FLIP)) {
            new Float: position[3];
            new Float: rotation;

            GetVehiclePos(vehicleId, position[0], position[1], position[2]);
            GetVehicleZAngle(vehicleId, rotation);

            SetVehiclePos(vehicleId, position[0], position[1], position[2] + 2);
            SetVehicleZAngle(vehicleId, rotation);

            RepairVehicle(vehicleId);

            GameTextForPlayer(playerid, "FLIPPED", 1000, 3);
        }

        // Vehicle keys (5): jump
        if (HOLDING(VEHICLE_KEYS_BINDING_JUMP) && (vehicleKeys & VEHICLE_KEYS_JUMP)) {
            new const Float: vehicleJump = 0.3;
            new Float: velocity[3];

            GetVehicleVelocity(vehicleId, velocity[0], velocity[1], velocity[2]);
            SetVehicleVelocity(vehicleId, velocity[0], velocity[1], velocity[2] + vehicleJump);
        }

        // Vehicle keys (6): nitro
        if (HOLDING(VEHICLE_KEYS_BINDING_NOS) && (vehicleKeys & VEHICLE_KEYS_NOS)) {
            new const modelId = GetVehicleModel(vehicleId);

            if (VehicleModel(modelId)->isNitroInjectionAvailable())
                AddVehicleComponent(vehicleId, 1010);
        }

        new const bool: pressedBlinkerRight =
            PRESSED(VEHICLE_KEYS_BINDING_BLINKER_RIGHT) && vehicleKeys & VEHICLE_KEYS_BLINKER_RIGHT;
        new const bool: pressedBlinkerLeft = 
            PRESSED(VEHICLE_KEYS_BINDING_BLINKER_LEFT) && vehicleKeys & VEHICLE_KEYS_BLINKER_LEFT;

        if(pressedBlinkerRight || pressedBlinkerLeft) {
            new const bool: blinkingOnRight = g_blinkerObjects[playerid][0] != DynamicObject: INVALID_OBJECT_ID;
            new const bool: blinkingOnLeft = g_blinkerObjects[playerid][2] != DynamicObject: INVALID_OBJECT_ID;

            new const bool: rightBlinker = pressedBlinkerRight ? !blinkingOnRight : blinkingOnRight;
            new const bool: leftBlinker = pressedBlinkerLeft ? !blinkingOnLeft : blinkingOnLeft;

            SetBlinker(playerid, vehicleId, leftBlinker, rightBlinker);
        }
    }

    LegacyPlayerKeyStateChange(playerid, newkeys, oldkeys);
    return 1;
}

// Enable the |left| and or |right| blinkers for |playerid| in |vehicleId|
SetBlinker(playerid, vehicleId, bool:left, bool:right) {
    new const blinkerModel = 19294;
    new const modelId = GetVehicleModel(vehicleId);

    if(VehicleModel(modelId)->isNitroInjectionAvailable()) {
        return;
    }

    new Float:sizeX, Float:sizeY, Float:sizeZ;
    GetVehicleModelInfo(modelId, VEHICLE_MODEL_INFO_SIZE, sizeX, sizeY, sizeZ);

    if (right) {
        if (g_blinkerObjects[playerid][0] == DynamicObject: INVALID_OBJECT_ID) {
            g_blinkerObjects[playerid][0] = CreateDynamicObject(blinkerModel, 0, 0, 0, 0, 0, 0);
            AttachDynamicObjectToVehicle(g_blinkerObjects[playerid][0], vehicleId, sizeX/2.23, sizeY/2.23, 
                0.1, 0, 0, 0);

            g_blinkerObjects[playerid][1] = CreateDynamicObject(blinkerModel, 0, 0, 0, 0, 0, 0);
            AttachDynamicObjectToVehicle(g_blinkerObjects[playerid][1], vehicleId, sizeX/2.23, -sizeY/2.23, 
                0.1, 0, 0, 0);
        }
    } else {
        DestroyDynamicBlinkerObject(playerid, 0);
        DestroyDynamicBlinkerObject(playerid, 1);
    }

    if (left) {
        if (g_blinkerObjects[playerid][2] == DynamicObject: INVALID_OBJECT_ID) {
            g_blinkerObjects[playerid][2] = CreateDynamicObject(blinkerModel, 0, 0, 0, 0, 0, 0);
            AttachDynamicObjectToVehicle(g_blinkerObjects[playerid][2], vehicleId, -sizeX/2.23, sizeY/2.23, 
                0.1, 0, 0, 0);

            g_blinkerObjects[playerid][3] = CreateDynamicObject(blinkerModel, 0, 0, 0, 0, 0, 0);
            AttachDynamicObjectToVehicle(g_blinkerObjects[playerid][3], vehicleId, -sizeX/2.23, -sizeY/2.23, 
                0.1, 0, 0, 0);
        }
    } else {
        DestroyDynamicBlinkerObject(playerid, 2);
        DestroyDynamicBlinkerObject(playerid, 3);
    }
}

// This resets the whole blinking status and removes the objects.
forward StopBlinking(playerid);
public StopBlinking(playerid) {
    DestroyDynamicBlinkerObject(playerid, 0);
    DestroyDynamicBlinkerObject(playerid, 1);
    DestroyDynamicBlinkerObject(playerid, 2);
    DestroyDynamicBlinkerObject(playerid, 3);
}

// Remove object if there is an object at the |index| for the |playerid|
DestroyDynamicBlinkerObject(playerid, index) {
    if (g_blinkerObjects[playerid][index] > DynamicObject: INVALID_OBJECT_ID) {
        DestroyDynamicObject(g_blinkerObjects[playerid][index]);
        g_blinkerObjects[playerid][index] = DynamicObject: INVALID_OBJECT_ID;
    }    
}

public OnPlayerEnterVehicle(playerid, vehicleid, ispassenger) {
    // Detects cases where the |playerid| is jacking the |vehicleid| from another player, which may
    // be the first steps towards the "ninja jacking" bug.
    if (!ispassenger) {
        new const currentDriverId = GetVehicleDriverID(vehicleid);
        if (currentDriverId) {
            g_ninjaJackLastAttemptTime[playerid] = GetTickCount();
            g_ninjaJackLastAttemptVictim[playerid] = currentDriverId;
        }
    }

    return 1;
}

public OnPlayerStateChange(playerid, newstate, oldstate) {
    // Track the most recently entered vehicle for the |playerid|, as a driver, to be able to detect
    // "ninja jacking", which will kill the driver.
    if (newstate == PLAYER_STATE_DRIVER) {
        g_ninjaJackCurrentVehicleId[playerid] = GetPlayerVehicleID(playerid);
    } else {
        g_ninjaJackCurrentVehicleId[playerid] = INVALID_VEHICLE_ID;
        StopBlinking(playerid);
    }

    return LegacyPlayerStateChange(playerid, newstate, oldstate);
}

public OnPlayerDeath(playerid, killerid, reason) {
    // Corrects the |killerid| when the "ninja jacking" bug has been used, and issues a monitor-
    // level abuse report on the player abusing that bug, informing administrators.
    if (killerid == INVALID_PLAYER_ID &&
            g_ninjaJackCurrentVehicleId[playerid] != INVALID_VEHICLE_ID) {
        new const currentDriverId = GetVehicleDriverID(g_ninjaJackCurrentVehicleId[playerid]);
        if (currentDriverId != INVALID_PLAYER_ID &&
                g_ninjaJackLastAttemptVictim[currentDriverId] == playerid) {
            printf("[abuse] Ninja jack detected after %d ms.",
                (GetTickCount() - g_ninjaJackLastAttemptTime[currentDriverId]));

            ReportAbuse(currentDriverId, "Ninja Jack", "monitor");

            killerid = currentDriverId;
            reason = WEAPON_VEHICLE;
        }
    }

    return LegacyPlayerDeath(playerid, killerid, reason);
}

public OnPlayerWeaponShot(playerid, weaponid, hittype, hitid, Float: fX, Float: fY, Float: fZ) {
#if Feature::EnableServerSideWeaponConfig == 0
    DetectAbuseOnWeaponShot(playerid, hittype, hitid);
#endif
    return LegacyPlayerWeaponShot(playerid, weaponid, hittype, hitid, fX, fY, fZ);
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
