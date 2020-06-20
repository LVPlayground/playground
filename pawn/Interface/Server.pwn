// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

// Provided by SA-MP, but not defined in the include files.
native gpci(playerid, serial[], len);
native IsValidVehicle(vehicleid);

// Provided by the PlaygroundJS plugin.
native IsPlayerEligibleForBenefit(playerid, benefit);
native IsPlayerMinimized(playerId);
native SetIsRegistered(playerid, bool: isRegistered);

// Defined in //javascript/features/collectables/collectable_benefits.js
#define PLAYER_BENEFIT_SPRAY_QUICK_VEHICLE_ACCESS 0
#define PLAYER_BENEFIT_BARREL_QUICK_VEHICLE_ACCESS 1
#define PLAYER_BENEFIT_FULL_QUICK_VEHICLE_ACCESS 2
#define PLAYER_BENEFIT_BOMB_SHOP 3
#define PLAYER_BENEFIT_VEHICLE_KEYS_COLOUR 4
#define PLAYER_BENEFIT_VEHICLE_KEYS_JUMP 5

native GetPlayerKillCountJS(playerid);
native GetPlayerDeathCountJS(playerid);
native GetPlayerMoneyJS(playerid);
native GivePlayerMoneyJS(playerid, amount);
native ResetPlayerMoneyJS(playerid);
native GetAccountBalanceJS(playerid, balance[]);
native DepositToAccountJS(playerid, amount);

// Provided by the Communication feature in JavaScript.
native GetPlayerTeleportStatus(playerId, timeLimited);
native ReportPlayerTeleport(playerId, timeLimited);

#define TELEPORT_STATUS_ALLOWED 0
#define TELEPORT_STATUS_REJECTED_FIGHTING 1
#define TELEPORT_STATUS_REJECTED_TIME_LIMIT 2
#define TELEPORT_STATUS_REJECTED_OTHER 3

#define VEHICLE_KEYS_BOOST 1
#define VEHICLE_KEYS_COLOUR 2
#define VEHICLE_KEYS_FIX 4
#define VEHICLE_KEYS_FLIP 8
#define VEHICLE_KEYS_JUMP 16
#define VEHICLE_KEYS_NOS 32
#define VEHICLE_KEYS_BLINKER_RIGHT 64
#define VEHICLE_KEYS_BLINKER_LEFT 128
#define VEHICLE_KEYS_GRAVITY 258

native IsCommunicationMuted();
native bool: SpawnPlayerInHouse(playerId);
native SetPlayerGravity(playerid, Float:value);

// -------------------------------------------------------------------------------------------------
// We override the GivePlayerMoney native as it's used to record intentional changes in a player's
// on-hand cash without being very intrusive to the rest of the gamemode. For similar reasons, the
// ResetPlayerMoney native is also being overriden, because it can cause increases as well.

#define GivePlayerMoney     GivePlayerMoneyJS
#define ResetPlayerMoney    ResetPlayerMoneyJS
#define GetPlayerMoney      GetPlayerMoneyJS

// -------------------------------------------------------------------------------------------------
// All actions of creating and removing vehicles should go through the VehicleManager class, because
// otherwise the gamemode will tag the vehicles as invalid and stop anything from changing them. In
// order to make sure we don't use CreateVehicle() and DestroyVehicle(), mark them as deprecated.

// Private methods which can be used by the VehicleManager to bypass the deprecation.
CreateVehiclePrivate(modelId, Float: x, Float: y, Float: z, Float: angle, color1, color2, respawn_delay) {
    return CreateVehicle(modelId, x, y, z, angle, color1, color2, respawn_delay);
}

AddStaticVehicleExPrivate(modelId, Float: x, Float: y, Float: z, Float: angle, color1, color2, respawn_delay) {
    return AddStaticVehicleEx(modelId, x, y, z, angle, color1, color2, respawn_delay);
}

DestroyVehiclePrivate(vehicleid) { return DestroyVehicle(vehicleid); }

// Now create hooked methods which will serve as the deprecated methods. They will be no-ops too and
// will thus return INVALID_VEHICLE_ID where appropriate.
#pragma deprecated
stock CreateVehicleHook({Float,_}:...) { return Vehicle::InvalidId; }

#pragma deprecated
stock DestroyVehicleHook({Float,_}:...) { }

#pragma deprecated
stock AddStaticVehicleHook({Float,_}:...) { return Vehicle::InvalidId; }

#pragma deprecated
stock AddStaticVehicleExHook({Float,_}:...) { return Vehicle::InvalidId; }

// And override the methods by telling the scanner to use the hooked methods instead.
#if Feature::EnableServerSideWeaponConfig == 1
    #undef CreateVehicle
    #undef DestroyVehicle
    #undef AddStaticVehicle
    #undef AddStaticVehicleEx
#endif

#define CreateVehicle       CreateVehicleHook
#define DestroyVehicle      DestroyVehicleHook
#define AddStaticVehicle    AddStaticVehicleHook
#define AddStaticVehicleEx  AddStaticVehicleExHook

// -------------------------------------------------------------------------------------------------
// We override the SetPlayerTime native because we'd like to have more control over the time we set
// for players. Instead, the TimeController::setTime() method should be used for global time, and
// the TimeController::setOverrideTimeForPlayer() method should be used for per-player overrides.

SetPlayerTimePrivate(playerId, hours, minutes) { SetPlayerTime(playerId, hours, minutes); }

#pragma deprecated
stock SetPlayerTimeHook({Float,_}:...) { }

#pragma deprecated
stock SetWorldTimeHook({Float,_}:...) { }

// And override the actual natives so they become no-operation functions.
#define SetPlayerTime       SetPlayerTimeHook
#define SetWorldTime        SetWorldTimeHook

// -------------------------------------------------------------------------------------------------
// We override the SetPlayerVirtualWorld() native so that it becomes void to players who have been
// isolated. They have been banished to their own virtual world, with no way out.

stock SetPlayerVirtualWorldHook(playerId, virtualWorldId) {
    if (PlayerSyncedData(playerId)->isolated())
        return;

    SetPlayerVirtualWorld(playerId, virtualWorldId);
}

// And override the actual natives so that they're caught by our hook.
#if Feature::EnableServerSideWeaponConfig == 1
    #undef SetPlayerVirtualWorld
#endif

#define SetPlayerVirtualWorld SetPlayerVirtualWorldHook

// -------------------------------------------------------------------------------------------------

SendClientMessagePrivate(playerid, color, const message[]) {
    new textBuffer[256];
    strins(textBuffer, message, 0, strlen(message));

    // If the text string exceeds the character limit of 144 chars, split it up.
    if (strlen(textBuffer) > 143) {
        // We actually want to remove this method, since automatically wrapping text is not really
        // a best practice. To be sure we do not have too long messages and since players are
        // certainly not going to report such bugs we do some temporary logging of too long messages
        new File: handle = fopen("messagelog/toolong.txt", io_append);
        if (handle) {
            new tooLongMessage[262];
            format(tooLongMessage, sizeof(tooLongMessage), "%s\r\n", textBuffer);
            fwrite(handle, tooLongMessage);
            fclose(handle);
        }

        // Look for the first whitespace at the end of the string.
        for (new index = 143; index > 0; index--) {
            if (strcmp(textBuffer[index], " ", false, 1))
                continue;

            // Call SendClientMessagePrivate on the first part of the string.
            new splitText[156];
            strmid(splitText, textBuffer, 0, index);
            SendClientMessagePrivate(playerid, color, splitText);

            // Call SendClientMessagePrivate on the remaining part of the string. If the string is
            // still too long, it will be split again.
            strdel(textBuffer, 0, index);
            SendClientMessagePrivate(playerid, color, textBuffer);

            break;
        }

        return 1;
    } else
        return SendClientMessage(playerid, color, message);
}

#define SendClientMessage   SendClientMessagePrivate

#define STREAMER_ENABLE_TAGS

// Consider moving these elsewhere:
#include "Interface/Server/a_mysql.pwn"
#include "Interface/Server/a_streamer.pwn"

// TODO: Move this elsewhere (maybe a_additional or something?)
strncpy(destination[], source[], maximumCount = sizeof(destination)) {
    for (new currentLength = 0; currentLength < maximumCount; ++currentLength) {
        destination[currentLength] = source[currentLength];
        if (source[currentLength] == 0)
            return;
    }
}
