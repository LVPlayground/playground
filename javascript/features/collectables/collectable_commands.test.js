// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('CollectableCommands', (it, beforeEach) => {
    let gunther = null;
    let manager = null;

    beforeEach(() => {
        const feature = server.featureManager.loadFeature('collectables');

        gunther = server.playerManager.getById(/* Gunther= */ 0);
        manager = feature.manager_;
    });
});
