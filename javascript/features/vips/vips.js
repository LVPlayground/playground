// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Feature = require('components/feature_manager/feature.js');
const VeryImportantPlayersManager = require('features/vips/vips_manager.js');

// Las Venturas Playground offers VIPs, players who've donated, an extra set
// of commands and features in order to thank them for their tremendous support.
class VeryImportantPlayers extends Feature {
    constructor() {
        super();

        this.manager_ = new VeryImportantPlayersManager();
    }

    // ---------------------------------------------------------------------------------------------
    // This feature has no public API.
    // ---------------------------------------------------------------------------------------------

    dispose() {}
}

exports = VeryImportantPlayers;
