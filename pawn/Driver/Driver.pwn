// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Natives provided by the PlaygroundJS plugin.
native MarkVehicleMoved(vehicleId);
native ProcessSprayTagForPlayer(playerid);
native ReportAbuse(playerid, detectorName[], certainty[]);
native ReportTrailerUpdate(vehicleid, trailerid);

#include "Driver/PawnConfig.pwn"
#include "Driver/Abuse/WeaponShotDetection.pwn"
#include "Driver/Drift/DriftHelpers.pwn"
#include "Driver/Drift/DriftUi.pwn"

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
#define VEHICLE_KEYS_BINDING_GRAVITY        KEY_ANALOG_UP

// Polygon that encloses the area of Las Venturas, on the insides of the highway.
new const Float: kLasVenturasAreaPolygon[] = {
    1353.59, 832.49,
    2465.32, 832.49,  // south-eastern corner
    2584.14, 892.06,
    2677.49, 1036.73,
    2677.49, 2287.71,
    2618.08, 2415.36,  // north-eastern corner
    2490.78, 2534.50,
    2270.14, 2560.03,  // north-western corner
    1667.59, 2381.32,
    1345.11, 2398.34,
    1243.27, 2279.20,
    1234.78, 960.14,  // south-western corner
    1277.22, 892.06
};

// Number of milliseconds a player has to be spraying in order to collect a spray tag.
new const kSprayTagTimeMs = 2000;

// Number of milliseconds between marking a vehicle as having moved due to unoccupied sync.
new const kUnoccupiedSyncMarkTimeMs = 185000;

// The area that describes the insides of Las Venturas. Made available and managed by the streamer.
new STREAMER_TAG_AREA: g_areaLasVenturas;

// Time (in milliseconds) until when damage issued by a particular player should be disabled.
new g_damageDisabledExpirationTime[MAX_PLAYERS] = { 0, ... };

// Boolean that indicates whether a particular player is currently in Las Venturas.
new bool: g_inLasVenturas[MAX_PLAYERS] = { false, ... };

// Keeps track of the last time a player was hit, and who hit them.
new g_lastTakenDamageIssuerId[MAX_PLAYERS] = { -1, ... };
new g_lastTakenDamageTime[MAX_PLAYERS];

// Keeps track of the last vehicle they entered, and hijacked, to work around "ninja jack" kills.
new g_ninjaJackCurrentVehicleId[MAX_PLAYERS];
new g_ninjaJackLastAttemptTime[MAX_PLAYERS];
new g_ninjaJackLastAttemptVictim[MAX_PLAYERS];

// Keeps track of when each player started spraying the spray tag, to determine total duration.
new g_sprayTagStartTime[MAX_PLAYERS];

// Time at which the player last used the boost Vehicle Keys feature.
new g_vehicleKeysLastBoost[MAX_PLAYERS];

// Time at which a vehicle has been marked for movement following an unoccupied sync.
new g_vehicleLastUnoccupiedSyncMark[MAX_VEHICLES];

// Vehicle ID of the trailer that's attached to a particular vehicle.
new g_vehicleTrailerId[MAX_VEHICLES];

// The four blinker objects for the player. 0/1 = RIGHT 2/3 = LEFT
new DynamicObject: g_blinkerObjects[MAX_PLAYERS][4];

// Default gravity falue
new const Float: g_defaultGravity = 0.008;

// The current player gravity (positive or negative)
new Float: g_playerGravity[MAX_PLAYERS];

// Returns whether the given |playerId| is able to use vehicle keys right now.
bool: CanUseVehicleKeys(playerId) {
    if (!g_vehicleKeysBlockedInLasVenturas)
        return true;

    return !g_inLasVenturas[playerId];
}

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

InitializeAreas() {
    g_areaLasVenturas = CreateDynamicPolygon(
        kLasVenturasAreaPolygon, /* minz= */ -1, /* maxz= */ 400,
        /* maxpoints= */ sizeof(kLasVenturasAreaPolygon), /* worldid= */ 0, /* interiorid= */ 0);
}

public OnPlayerConnect(playerid) {
    g_aimbotSuspicionCount[playerid] = 0;
    g_lastTakenDamageIssuerId[playerid] = -1;
    g_lastTakenDamageTime[playerid] = 0;
    g_sprayTagStartTime[playerid] = 0;
    g_playerGravity[playerid] = g_defaultGravity;
    g_inLasVenturas[playerid] = false;
    g_isDisconnecting[playerid] = false;

    g_playerDriftStartTime[playerid] = 0;

    InitializePlayerDriftTextDraws(playerid);

    // Proceed with legacy processing.
    return PlayerEvents(playerid)->onPlayerConnect();
}

public OnPlayerSpawn(playerid) {
    g_damageDisabledExpirationTime[playerid] = 0;
    return LVPPlayerSpawn(playerid);
}

public OnPlayerDisconnect(playerid, reason) {
    g_isDisconnecting[playerid] = true;

    DestroyPlayerDriftTextDraws(playerid);
    StopBlinking(playerid);

    // The player might be using /q to avoid being killed by their opponent. In that case we make
    // sure that the kill gets attributed to their opponent after all.
    if (g_lastTakenDamageTime[playerid] > 0 && g_lastTakenDamageIssuerId[playerid] != -1) {
        new const millisecondDifference = GetTickCount() - g_lastTakenDamageTime[playerid];
        if (millisecondDifference < g_abuseKillAttributionTimeSec * 1000)
            OnPlayerDeath(playerid, g_lastTakenDamageIssuerId[playerid], 24);
    }

    for (new i = 0; i < MAX_PLAYERS; ++i) {
        if (g_lastTakenDamageIssuerId[i] == playerid)
            g_lastTakenDamageIssuerId[i] = -1;
    }

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
    if (PlayerSyncedData(playerid)->vehicleKeys() > 0 && AreVehicleKeysAvailable(playerid) &&
            GetPlayerVehicleSeat(playerid) == 0 /* also checks if |playerid| is in a vehicle */) {
        new const vehicleId = GetPlayerVehicleID(playerid);
        new const vehicleKeys = PlayerSyncedData(playerid)->vehicleKeys();

        // Vehicle keys (1): speed boost
        if (HOLDING(VEHICLE_KEYS_BINDING_BOOST) && (vehicleKeys & VEHICLE_KEYS_BOOST)) {
            new const boostLimitMs = 1250;
            new const Float: boost = 1.5;

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
            new primaryColour = 128 + random(122);  // [128, 250]
            new secondaryColour = 128 + random(122);  // [128, 250]

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
            new Float: position[3];

            GetVehiclePos(vehicleId, position[0], position[1], position[2]);

            // Only allow vehicle jumping outside of the City of Las Venturas, to not disturb DMers.
            if (CanUseVehicleKeys(playerid)) {
                new const Float: vehicleJump = 0.3;
                new Float: velocity[3];

                GetVehicleVelocity(vehicleId, velocity[0], velocity[1], velocity[2]);
                SetVehicleVelocity(vehicleId, velocity[0], velocity[1], velocity[2] + vehicleJump);
            }
        }

        // Vehicle keys (6): nitro
        if (HOLDING(VEHICLE_KEYS_BINDING_NOS) && (vehicleKeys & VEHICLE_KEYS_NOS)) {
            new const modelId = GetVehicleModel(vehicleId);

            if (CanUseVehicleKeys(playerid) && VehicleModel(modelId)->isNitroInjectionAvailable())
                AddVehicleComponent(vehicleId, 1010);
        }

        // Vehicle keys (7): Blinkers
        new const bool: pressedBlinkerRight =
            PRESSED(VEHICLE_KEYS_BINDING_BLINKER_RIGHT) && vehicleKeys & VEHICLE_KEYS_BLINKER_RIGHT;
        new const bool: pressedBlinkerLeft = 
            PRESSED(VEHICLE_KEYS_BINDING_BLINKER_LEFT) && vehicleKeys & VEHICLE_KEYS_BLINKER_LEFT;

        if(pressedBlinkerRight || pressedBlinkerLeft) {
            new const bool: blinkingOnRight = !!IsValidDynamicObject(g_blinkerObjects[playerid][0]);
            new const bool: blinkingOnLeft = !!IsValidDynamicObject(g_blinkerObjects[playerid][2]);

            new const bool: rightBlinker = pressedBlinkerRight ? !blinkingOnRight : blinkingOnRight;
            new const bool: leftBlinker = pressedBlinkerLeft ? !blinkingOnLeft : blinkingOnLeft;

            SetBlinker(playerid, vehicleId, leftBlinker, rightBlinker);
        }

        // Vehicle keys (8): Gravity
        if(PRESSED(VEHICLE_KEYS_BINDING_GRAVITY) && vehicleKeys & VEHICLE_KEYS_GRAVITY) {
            if (CanUseVehicleKeys(playerid)) {
                g_playerGravity[playerid] *= -1;
                SetPlayerGravity(playerid, g_playerGravity[playerid]);
            }
        }
    }

    LegacyPlayerKeyStateChange(playerid, newkeys, oldkeys);
    return 1;
}

// Enable the |left| and/or |right| blinkers for |playerId| who is driving the |vehicleId|.
SetBlinker(playerId, vehicleId, bool: left, bool: right) {
    new const kBlinkerModel = 19294;
    new const modelId = GetVehicleModel(vehicleId);

    if (!VehicleModel(modelId)->isNitroInjectionAvailable())
        return;

    new Float: sizeX, Float: sizeY, Float: sizeZ;
    GetVehicleModelInfo(modelId, VEHICLE_MODEL_INFO_SIZE, sizeX, sizeY, sizeZ);

    if (right) {
        if (!IsValidDynamicObject(g_blinkerObjects[playerId][0])) {
            g_blinkerObjects[playerId][0] = CreateDynamicObject(kBlinkerModel, 0, 0, 0, 0, 0, 0);
            AttachDynamicObjectToVehicle(g_blinkerObjects[playerId][0], vehicleId, sizeX / 2.23,
                                         sizeY / 2.23, 0.1, 0, 0, 0);

            g_blinkerObjects[playerId][1] = CreateDynamicObject(kBlinkerModel, 0, 0, 0, 0, 0, 0);
            AttachDynamicObjectToVehicle(g_blinkerObjects[playerId][1], vehicleId, sizeX / 2.23,
                                         -sizeY / 2.23, 0.1, 0, 0, 0);
        }
    } else {
        DestroyDynamicBlinkerObject(playerId, 0);
        DestroyDynamicBlinkerObject(playerId, 1);
    }

    if (left) {
        if (!IsValidDynamicObject(g_blinkerObjects[playerId][2])) {
            g_blinkerObjects[playerId][2] = CreateDynamicObject(kBlinkerModel, 0, 0, 0, 0, 0, 0);
            AttachDynamicObjectToVehicle(g_blinkerObjects[playerId][2], vehicleId, -sizeX / 2.23,
                                         sizeY / 2.23, 0.1, 0, 0, 0);

            g_blinkerObjects[playerId][3] = CreateDynamicObject(kBlinkerModel, 0, 0, 0, 0, 0, 0);
            AttachDynamicObjectToVehicle(g_blinkerObjects[playerId][3], vehicleId, -sizeX / 2.23,
                                         -sizeY / 2.23, 0.1, 0, 0, 0);
        }
    } else {
        DestroyDynamicBlinkerObject(playerId, 2);
        DestroyDynamicBlinkerObject(playerId, 3);
    }
}

// This resets the whole blinking status and removes the objects.
StopBlinking(playerid) {
    for (new index = 0; index < 4; ++index)
        DestroyDynamicBlinkerObject(playerid, index);
}

// Remove object if there is an object at the |index| for the |playerid|
DestroyDynamicBlinkerObject(playerid, index) {
    if (g_blinkerObjects[playerid][index] == DynamicObject: INVALID_STREAMER_ID)
        return;

    DestroyDynamicObject(g_blinkerObjects[playerid][index]);

    g_blinkerObjects[playerid][index] = DynamicObject: INVALID_STREAMER_ID;
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

        if (g_playerGravity[playerid] != g_defaultGravity) {
            g_playerGravity[playerid] = g_defaultGravity;
            SetPlayerGravity(playerid, g_playerGravity[playerid]);
        }
    }

    // When the |player| left their vehicle, and in-progress drifts may have to stop. It's a bit
    // silly to exit a vehicle while drifting, but you never know, they might've hit a tree.
    if (oldstate == PLAYER_STATE_DRIVER)
        ProcessDriftLeaveVehicleForPlayer(playerid);

    // When the player is leaving a vehicle, disable their damage for a predefined amount of time
    // to avoid players from abusing vehicle bugs to give them an advantage in a fight.
    if ((oldstate == PLAYER_STATE_DRIVER || oldstate == PLAYER_STATE_PASSENGER)
            && g_abuseFakeCarEntryPreventionSec > 0) {
        g_damageDisabledExpirationTime[playerid] =
            GetTickCount() + g_abuseFakeCarEntryPreventionSec * 1000;
    }

    return LegacyPlayerStateChange(playerid, newstate, oldstate);
}

forward UpdateVehicleTrailerStatus();
public UpdateVehicleTrailerStatus() {
    for (new vehicleId = 1; vehicleId < GetVehiclePoolSize(); ++vehicleId) {
        new const trailerId = GetVehicleTrailer(vehicleId);
        if (trailerId == g_vehicleTrailerId[vehicleId])
            continue;  // no change in the trailer attached to the |vehicleId|

        g_vehicleTrailerId[vehicleId] = trailerId;

        if (!IsValidVehicle(vehicleId))
            continue;

        ReportTrailerUpdate(vehicleId, trailerId);
    }
}

public OnPlayerDeath(playerid, killerid, reason) {
    // Fixes the issue where the player has died, but is still walking around for a a while. Sourced
    // from the GTA: San Andreas Splitmode for SA:MP mode by iou.
    if (!g_isDisconnecting[playerid])
        SetPlayerHealth(playerid, 100);

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

    // If `/kill` was used, it's possible that the death might be attributed to an invalid player
    // due to a SA-MP bug. Reset the |killerid| when this happens. Kill attribution for command
    // abuse will still be able to set the |killerid| to another player Id, however.
    if (preventKillLamers[playerid]) {
        killerid = INVALID_PLAYER_ID;
        preventKillLamers[playerid] = 0;
    }

    // If the |playerid| has killed themselves, or through other means wants to avoid getting an
    // attributed kill from their opponent, we'll make sure we do it for them.
    if (killerid == INVALID_PLAYER_ID && g_lastTakenDamageTime[playerid] > 0 &&
            g_lastTakenDamageIssuerId[playerid] != -1) {
        new const millisecondDifference = GetTickCount() - g_lastTakenDamageTime[playerid];
        if (millisecondDifference < g_abuseKillAttributionTimeSec * 1000) {
            killerid = g_lastTakenDamageIssuerId[playerid];
            reason = 24;
        }
    }

    // Reset the last damage statistics for the |player| now that all's been set.
    g_lastTakenDamageIssuerId[playerid] = -1;
    g_lastTakenDamageTime[playerid] = 0;

    return LegacyPlayerDeath(playerid, killerid, reason);
}

public OnPlayerWeaponShot(playerid, weaponid, hittype, hitid, Float: fX, Float: fY, Float: fZ) {
#if Feature::EnableServerSideWeaponConfig == 0
    DetectAbuseOnWeaponShot(playerid, hittype, hitid);

    // If damage has been disabled for the |playerid|, discard the shots entirely. It will expire
    // automatically when the time has passed.
    if (g_damageDisabledExpirationTime[playerid] > 0) {
        if (g_damageDisabledExpirationTime[playerid] < GetTickCount())
            g_damageDisabledExpirationTime[playerid] = 0;
        else
            return 0;
    }

    // We might want to ignore damage done by players who are passengers as the sole occupant of a
    // vehicle. They can only be damaged with a chainsaw, making this very unfair in fights.
    if (g_abuseIgnoreSolePassengerDamage && hittype != BULLET_HIT_TYPE_NONE) {
        new const playerVehicleId = GetPlayerVehicleID(playerid);
        new const playerVehicleSeat = GetPlayerVehicleSeat(playerid);

        if (playerVehicleId != 0 && playerVehicleSeat != 0) {
            new bool: foundDriver = false;

            for (new otherPlayerId = 0; otherPlayerId < GetPlayerPoolSize(); ++otherPlayerId) {
                if (otherPlayerId == playerid)
                    continue;  // the |otherplayerId| is the |playerid|!

                if (GetPlayerVehicleID(otherPlayerId) != playerVehicleId)
                    continue;  // the |otherPlayerId| is not connected, or not in the same vehicle

                if (GetPlayerVehicleSeat(otherPlayerId) != 0)
                    continue;  // the |otherPlayerId| is not a driver either

                foundDriver = true;
                break;
            }

            if (!foundDriver)
                return 0;
        }
    }

    if (PlayerSyncedData(playerid)->skipDamage())
        return 0;

#endif
    return LegacyPlayerWeaponShot(playerid, weaponid, hittype, hitid, fX, fY, fZ);
}

public OnPlayerTakeDamage(playerid, issuerid, Float: amount, weaponid, bodypart) {
#if Feature::EnableServerSideWeaponConfig == 0
    if (issuerid != INVALID_PLAYER_ID) {
        g_lastTakenDamageIssuerId[playerid] = issuerid;
        g_lastTakenDamageTime[playerid] = GetTickCount();
    }

    return LVPPlayerTakeDamage(playerid, issuerid, amount, weaponid, bodypart);
#else
    return 1;
#endif
}

// Zone management, powered by the streamer.
public OnPlayerEnterDynamicArea(playerid, STREAMER_TAG_AREA:areaid) {
    if (areaid == g_areaLasVenturas)
        g_inLasVenturas[playerid] = true;
    else
        ShipManager->onPlayerEnterShip(playerid, areaid);
}

public OnPlayerLeaveDynamicArea(playerid, STREAMER_TAG_AREA:areaid) {
    if (areaid == g_areaLasVenturas)
        g_inLasVenturas[playerid] = false;
    else
        ShipManager->onPlayerLeaveShip(playerid, areaid);
}

// Unoccupied but moved vehicles should be scheduled for respawn after a certain amount of time
// passes. Only forward this to JavaScript at most once per minute per vehicle.
public OnUnoccupiedVehicleUpdate(vehicleid, playerid, passenger_seat, Float:new_x, Float:new_y, Float:new_z, Float:vel_x, Float:vel_y, Float:vel_z) {
    new const currentTime = GetTickCount();
    new const difference = currentTime - g_vehicleLastUnoccupiedSyncMark[vehicleid];

    if (difference < kUnoccupiedSyncMarkTimeMs)
        return 1;

    g_vehicleLastUnoccupiedSyncMark[vehicleid] = currentTime;

    // Calls the MarkVehicleMoved() JavaScript native, which will mark the |vehicleid| for respawn.
    MarkVehicleMoved(vehicleid);

    return 1;
    #pragma unused playerid, passenger_seat, new_x, new_y, new_z, vel_x, vel_y, vel_z
}

// Define so that JavaScript can intercept the events.
public OnPlayerText(playerid, text[]) {}
public OnPlayerEditDynamicObject(playerid, STREAMER_TAG_OBJECT:objectid, response, Float:x, Float:y, Float:z, Float:rx, Float:ry, Float:rz) {}
public OnPlayerPickUpDynamicPickup(playerid, STREAMER_TAG_PICKUP:pickupid) {}
public OnPlayerSelectDynamicObject(playerid, STREAMER_TAG_OBJECT:objectid, modelid, Float:x, Float:y, Float:z) {}
public OnPlayerShootDynamicObject(playerid, weaponid, STREAMER_TAG_OBJECT:objectid, Float:x, Float:y, Float:z) {}

forward OnPlayerChecksumAvailable(playerid, address, checksum);
public OnPlayerChecksumAvailable(playerid, address, checksum) {}

#if Feature::EnableServerSideWeaponConfig == 0
public OnPlayerUpdate(playerid) {
    if (g_driftingEnabled)
        ProcessDriftUpdateForPlayer(playerid);

    // Determines if the player is entering a vehicle through animation, and if so, marks the time
    // until which their damage should be disabled based on the prevention setting.
    if (g_abuseFakeCarEntryPreventionSec > 0) {
        new const animationIndex = GetPlayerAnimationIndex(playerid);
        switch (animationIndex) {
            case 1043 /* CAR_OPEN_LHS */, 1044 /* CAR_OPEN_RHS */,
                 1026 /* CAR_GETIN_LHS */, 1027 /* CAR_GETIN_RHS */: {
                g_damageDisabledExpirationTime[playerid] =
                    GetTickCount() + g_abuseFakeCarEntryPreventionSec * 1000;
            }
        }
    }

    return 1;
}
#endif
