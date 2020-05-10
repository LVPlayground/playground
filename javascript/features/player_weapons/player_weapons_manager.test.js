// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('PlayerSettingsManager', (it, beforeEach, afterEach) => {
    let manager = null;
    let playerWeapons = null;

    beforeEach(() => {
        playerWeapons = server.featureManager.loadFeature('player_weapons');

        manager = playerSettings.manager_;
    });

    afterEach(() => {
        playerWeapons.dispose();
    });
});