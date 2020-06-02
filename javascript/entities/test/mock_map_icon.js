// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { MapIcon } from 'entities/map_icon.js';

// Global MapIcon counter used for testing.
let globalMapIconId = 0;

// Implementation of the MapIcon class with the actual Pawn calls mocked out, to make the
// infrastructure appropriate for testing purposes.
export class MockMapIcon extends MapIcon {
    createInternal(options) {
        return ++globalMapIconId;
    }

    destroyInternal() {}
}
