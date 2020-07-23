// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { AbuseDetector } from 'features/abuse/abuse_detector.js';
import { AbuseDetectors } from 'features/abuse/abuse_detectors.js';
import { AbuseMonitor } from 'features/abuse/abuse_monitor.js';

describe('AbuseDetectors', (it, beforeEach, afterEach) => {
    let fakeConstructorCalled = 0;
    let fakeDisposeCalled = 0;

    // Fake setting and constructor that can be used in tests.
    const kFakeSetting = 'abuse/detector_fake';
    const kFakeConstructor = class extends AbuseDetector {
        constructor(...params) {
            super(...params, 'FakeDetector');

            fakeConstructorCalled++;
        }
        dispose() {
            fakeDisposeCalled++;
        }
    };

    let announce = null;
    let detectors = null;
    let gunther = null;
    let settings = null;

    beforeEach(() => {
        announce = server.featureManager.loadFeature('announce');
        settings = server.featureManager.loadFeature('settings');

        const monitor = new AbuseMonitor(() => announce);

        detectors = new AbuseDetectors(
            server.featureManager.createDependencyWrapperForFeature('settings'),
            monitor);
        
        gunther = server.playerManager.getById(/* Gunther= */ 0);
        gunther.level = Player.LEVEL_ADMINISTRATOR;
    });

    afterEach(() => {
        detectors.dispose();
        detectors = null;
    });

    it('should be able to dynamically toggle detectors on setting changes', assert => {
        detectors.detectorInfo_.set(kFakeSetting, kFakeConstructor);

        const originalDetectorCount = detectors.enabledDetectors;
        detectors.onDetectorSettingChange(kFakeSetting, /* enabled= */ true);
        assert.isAbove(detectors.enabledDetectors, originalDetectorCount);

        detectors.onDetectorSettingChange(kFakeSetting, /* enabled =*/ false);
        assert.equal(detectors.enabledDetectors, originalDetectorCount);

        detectors.detectorInfo_.delete(kFakeSetting);
    });

    it('should enable detectors to report incidents to the monitor', assert => {
        detectors.detectorInfo_.set(kFakeSetting, kFakeConstructor);

        const originalDetectorCount = detectors.enabledDetectors;
        detectors.onDetectorSettingChange(kFakeSetting, /* enabled= */ true);

        for (const detector of detectors.activeDetectors) {
            if (!(detector instanceof kFakeConstructor))
                continue;
            
            detector.report(gunther);
        }
        
        assert.equal(gunther.messages.length, 1);
        assert.includes(gunther.messages[0], 'might be using');
        assert.includes(gunther.messages[0], 'FakeDetector');

        detectors.detectorInfo_.delete(kFakeSetting);
    });
});
