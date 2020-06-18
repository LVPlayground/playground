// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Configuration options that can be manipulated from JavaScript through the PawnConfig class in
// //features/settings/pawn_config.js. Each option will be stored as a global Pawn variable.

// Section: abuse
new bool: g_abuseIgnoreSolePassengerDamage = true;
new bool: g_abuseKickReasonsPublic = true;

// Section: drifting
new bool: g_driftingEnabled = false;
new Float: g_driftingMaxAngle = 82.5;
new Float: g_driftingMinAngle = 14.0;
new Float: g_driftingMinSpeed = 50.0;

// These are the unique Ids for each of the properties that can be updated. They must be identical
// between the Pawn and the JavaScript code.
// Next ID: 7
enum PawnConfigProperty {
    kAbuseIgnoreSolePassengerDamage = 5,
    kAbuseKickReasonPublic = 6,
    kVehiclesDriftingEnabled = 1,
    kVehiclesDriftingMaxAngle = 2,
    kVehiclesDriftingMinAngle = 3,
    kVehiclesDriftingMinSpeed = 4,
};

// Called when a configuration option has been updated from JavaScript. Will immediately be applied
// in Pawn code. Warnings will be issued for unrecognised properties.
forward OnPawnConfigDataChange(PawnConfigProperty: property, Float: numberValue);
public OnPawnConfigDataChange(PawnConfigProperty: property, Float: numberValue) {
    new const intValue = floatround(numberValue, floatround_tozero);

    switch (property) {
        // Section: boolean properties
        case kAbuseIgnoreSolePassengerDamage:
            g_abuseIgnoreSolePassengerDamage = !!intValue;

        case kAbuseKickReasonPublic:
            g_abuseKickReasonsPublic = !!intValue;

        case kVehiclesDriftingEnabled:
            g_driftingEnabled = !!intValue;

        // Section: floating point properties
        case kVehiclesDriftingMaxAngle:
            g_driftingMaxAngle = numberValue;

        case kVehiclesDriftingMinAngle:
            g_driftingMinAngle = numberValue;

        case kVehiclesDriftingMinSpeed:
            g_driftingMinSpeed = numberValue;

        // Section: integer properties

        default:
            printf("[PawnConfig][warning] Invalid property in update: %d", _: property);
    }
}

// Functions to allow legacy parts of the gamemode to access the values. Only when needed.
AreKickReasonsPublic() { return g_abuseKickReasonsPublic ? 1 : 0; }
