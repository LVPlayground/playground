// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Feature } from 'components/feature_manager/feature.js';

// Provides the ability for players to have a customised appearance. Whether they want full hair,
// a watch, funky glasses or anything else, this feature is able to drive it.
export default class PlayerDecorations extends Feature {
    constructor() { super(); }

    // ---------------------------------------------------------------------------------------------
    // Public API of the PlayerDecorations feature
    // ---------------------------------------------------------------------------------------------

    // Resumes display of decorations for the given |player|.
    resumeForPlayer(player) {}

    // Suspends display of decorations for the given |player|.
    suspendForPlayer(player) {}

    // ---------------------------------------------------------------------------------------------

    dispose() {}
}
