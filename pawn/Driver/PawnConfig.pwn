// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Configuration options that can be manipulated from JavaScript through the PawnConfig class in
// //features/settings/pawn_config.js. Each option will be stored as a global Pawn variable.

// Section: abuse
new g_abuseFakeCarEntryPreventionEnterMs = 3000;
new g_abuseFakeCarEntryPreventionExitMs = 1750;
new bool: g_abuseIgnoreSolePassengerDamage = true;
new bool: g_abuseKickReasonsPublic = true;
new g_abuseKillAttributionTimeSec = 10;

// Section: drifting
new bool: g_driftingEnabled = false;
new Float: g_driftingMaxAngle = 82.5;
new Float: g_driftingMaxDistance = 23.0;
new Float: g_driftingMinAngle = 14.0;
new Float: g_driftingMinSpeed = 50.0;
new g_driftPointDivider = 2;

// Section: vehicles
new bool: g_vehicleKeysBlockedInLasVenturas = true;

// These are the unique Ids for each of the properties that can be updated. They must be identical
// between the Pawn and the JavaScript code.
// Next ID: 13
enum PawnConfigProperty {
    kAbuseFakeCarEntryPreventionEnterMs = 11,
    kAbuseFakeCarEntryPreventionExitMs = 12,
    kAbuseIgnoreSolePassengerDamage = 5,
    kAbuseKickReasonPublic = 6,
    kAbuseKillAttributionTimeSec = 7,
    kVehiclesDriftingEnabled = 1,
    kVehiclesDriftingMaxAngle = 2,
    kVehiclesDriftingMaxDistance = 8,
    kVehiclesDriftingMinAngle = 3,
    kVehiclesDriftingMinSpeed = 4,
    kVehiclesDriftingPointDivider = 9,
    kVehiclesKeysBlockedInLasVenturas = 10,
};

// Called when a configuration option has been updated from JavaScript. Will immediately be applied
// in Pawn code. Warnings will be issued for unrecognised properties.
forward OnPawnConfigDataChange(PawnConfigProperty: property, Float: numberValue);
public OnPawnConfigDataChange(PawnConfigProperty: property, Float: numberValue) {
    new const intValue = floatround(numberValue, floatround_tozero);

    switch (property) {
        case kAbuseFakeCarEntryPreventionEnterMs:
            g_abuseFakeCarEntryPreventionEnterMs = intValue;

        case kAbuseFakeCarEntryPreventionExitMs:
            g_abuseFakeCarEntryPreventionExitMs = intValue;

        case kAbuseIgnoreSolePassengerDamage:
            g_abuseIgnoreSolePassengerDamage = !!intValue;

        case kAbuseKickReasonPublic:
            g_abuseKickReasonsPublic = !!intValue;

        case kAbuseKillAttributionTimeSec:
            g_abuseKillAttributionTimeSec = intValue;

        case kVehiclesDriftingEnabled:
            g_driftingEnabled = !!intValue;

        case kVehiclesDriftingMaxAngle:
            g_driftingMaxAngle = numberValue;

        case kVehiclesDriftingMaxDistance:
            g_driftingMaxDistance = numberValue;

        case kVehiclesDriftingMinAngle:
            g_driftingMinAngle = numberValue;

        case kVehiclesDriftingMinSpeed:
            g_driftingMinSpeed = numberValue;

        case kVehiclesDriftingPointDivider:
            g_driftPointDivider = intValue;

        case kVehiclesKeysBlockedInLasVenturas:
            g_vehicleKeysBlockedInLasVenturas = !!intValue;

        default:
            printf("[PawnConfig][warning] Invalid property in update: %d", _: property);
    }
}

// Functions to allow legacy parts of the gamemode to access the values. Only when needed.
AreKickReasonsPublic() { return g_abuseKickReasonsPublic ? 1 : 0; }
