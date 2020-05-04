// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('CleoDmageDetector', (it, beforeEach) => {
    let gunther = null;
    let russell = null;

    let settings = null;

    beforeEach(() => {
        gunther = server.playerManager.getById(/* Gunther= */ 0);
        russell = server.playerManager.getById(/* Russell= */ 1);
        settings = server.featureManager.loadFeature('settings');

        // Make Russell an administrator so that he receives admin notices.
        russell.level = Player.LEVEL_ADMINISTRATOR;

        // Load the |abuse| feature to make sure the detectors are running.
        server.featureManager.loadFeature('abuse');
    });

    it('is able to detect use of CLEO Pro-Aim by players', assert => {
        settings.setValue('abuse/detector_cleo_proaim', /* enabled= */ true);

        // TODO: Implement some tests.
    });
});
