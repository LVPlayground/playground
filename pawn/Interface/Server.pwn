// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

#include "Interface/Server/a_samp.pwn"

// -------------------------------------------------------------------------------------------------
// JavaScript is the future of the Las Venturas Playground gamemode.

new bool: g_javaScriptInitialized = false;

stock bool: IsJavaScriptInitialized() {
    return g_javaScriptInitialized;
}

// -------------------------------------------------------------------------------------------------
// We override the GivePlayerMoney native as it's used to record intentional changes in a player's
// on-hand cash without being very intrusive to the rest of the gamemode. For similar reasons, the
// ResetPlayerMoney native is also being overriden, because it can cause increases as well.

// Private methods which should only be invoked by the Player money state tracker.
GivePlayerMoneyPrivate(playerId, amount) { GivePlayerMoney(playerId, amount); }
ResetPlayerMoneyPrivate(playerId) { ResetPlayerMoney(playerId); }
GetPlayerMoneyPrivate(playerId) { return GetPlayerMoney(playerId); }

// Hooked methods which will be invoked instead of the default native functions.
GivePlayerMoneyHook(playerId, amount) { PlayerMoneyState(playerId)->increase(amount); }
ResetPlayerMoneyHook(playerId) { PlayerMoneyState(playerId)->reset(); }

#define GivePlayerMoney     GivePlayerMoneyHook
#define ResetPlayerMoney    ResetPlayerMoneyHook
#define GetPlayerMoney(%0)  PlayerMoneyState(%0)->current()

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
// We override the TextDrawCreate method in beta builds because there is quite a bit of code around
// which tries to destroy TextDraws with Id=0, even though this is perfectly valid. In such cases,
// crash the current execution path for the sake of getting a stack trace.
#if BETA_TEST == 1

stock TextDrawDestroyHook(Text: textDrawId) {
    if (_: textDrawId == 0)
        CRASH("WARNING: Text draw with Id=0 is being destroyed.");
    return TextDrawDestroy(textDrawId);
}

#define TextDrawDestroy TextDrawDestroyHook

#endif

// -------------------------------------------------------------------------------------------------

#define STREAMER_ENABLE_TAGS

// Consider moving these elsewhere:
#include "Interface/Server/a_mysql.pwn"
#include "Interface/Server/a_zones.pwn"
#include "Interface/Server/a_streamer.pwn"

// TODO: Move this elsewhere (maybe a_additional or something?)
stock strncpy(destination[], source[], maximumCount = sizeof(destination)) {
    for (new currentLength = 0; currentLength < maximumCount; ++currentLength) {
        destination[currentLength] = source[currentLength];
        if (source[currentLength] == 0)
            return;
    }
}
