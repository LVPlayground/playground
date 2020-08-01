// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Feature } from 'components/feature_manager/feature.js';

// The teleportation system features a series of logic that allows players to teleport to specific
// locations, as well as to one another directly. This depends on anti-abuse regulations, as well
// as player-specific settings, such as the VIP ability to turn it off.
export default class Teleportation extends Feature {
    constructor() {
        super();

        // /taxi
        // /tow
    }

    dispose() {

    }
}
