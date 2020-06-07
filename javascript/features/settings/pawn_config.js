// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Setting from 'entities/setting.js';

// List of PawnConfig settings with their unique values and settings. Must be synced with Pawn. The
// settings can be in any category, of any type, as long as the identifier is a valid one.
// Next ID: 2
const kSynchronizedSettings = new Map([
    [ 'playground/enable_drift_features', { id: 1 } ]
]);

// Analogous to the PawnConfig class in Pawn, but on the sending side. Observes settings in the
// |kSynchronizedSettings| map, and synchronizes them with Pawn when they change value.
export class PawnConfig {
    // Called when a setting has changed value. Will ignore anything that's not explicitly been
    // added to the |kSynchronizedSettings| map, keyed by setting identifier.
    onSettingUpdated(setting, value) {
        const configuration = kSynchronizedSettings.get(setting.identifier);
        if (!configuration)
            return;  // the |setting| should not be synchronized

        switch (setting.type) {
            case Setting.TYPE_BOOLEAN:
                this.pawnConfigDataChange(configuration.id, { numberValue: !!value ? 1 : 0 });
                break;

            case Setting.TYPE_NUMBER:
                this.pawnConfigDataChange(configuration.id, { numberValue: value });
                break;
        }
    }

    // Calls through to the OnPawnConfigDataChange event in Pawn to update the value, with the
    // given parameters. Will run it after a slight delay to avoid re-entrancy issues.
    pawnConfigDataChange(property, { numberValue = 0 } = {}) {
        if (server.isTest())
            return;  // do not propagate changes in tests

        wait(0).then(() =>
            pawnInvoke('OnPawnConfigDataChange', 'if', property, numberValue));
    }
}
