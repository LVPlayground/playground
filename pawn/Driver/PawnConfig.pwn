// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Configuration options that can be manipulated from JavaScript through the PawnConfig class in
// //features/settings/pawn_config.js. Each option will be stored as a global Pawn variable.

// Section: drifting
new bool: g_driftingEnabled = false;

// These are the unique Ids for each of the properties that can be updated. They must be identical
// between the Pawn and the JavaScript code.
// Next ID: 2
enum PawnConfigProperty {
    kDriftEnabled = 1
};

// Called when a configuration option has been updated from JavaScript. Will immediately be applied
// in Pawn code. Warnings will be issued for unrecognised properties.
forward OnPawnConfigDataChange(PawnConfigProperty: property, Float: numberValue);
public OnPawnConfigDataChange(PawnConfigProperty: property, Float: numberValue) {
    new const intValue = floatround(numberValue, floatround_tozero);

    switch (property) {
        // Section: boolean properties
        case kDriftEnabled:
            g_driftingEnabled = !!intValue;

        // Section: floating point properties
        // Section: integer properties

        default:
            printf("[PawnConfig][warning] Invalid property in update: %d", _: property);
    }
}
