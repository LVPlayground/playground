// Copyright 2017 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Registry of active color pickers on Las Venturas Playground.
const registry = new WeakMap();

// Manages the color pickers, displayed through Pawn, that players may have requested from features
// which are implemented in JavaScript. A central registry is required as multiple people may be
// using the color pickers at the same time.
export class ColorPickerManager {
    // Registers the |colorPicker| as being active for |player|.
    static register(player, colorPicker) {
        if (registry.has(player))
            ColorPickerManager.sendResult(player, null /* dismissed */);

        registry.set(player, colorPicker);
    }

    // Shares that the |player| has selected the |value|, which may be NULL, with the color picker
    // that has been created on their behalf.
    static sendResult(player, value) {
        const colorPicker = registry.get(player);
        if (!colorPicker)
            return;

        colorPicker.didSelectColor(value);
    }

    // Unregisters any color picker that may be active for the |player|.
    static unregister(player) {
        registry.delete(player);
    }
}
