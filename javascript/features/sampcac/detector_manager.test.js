// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { DetectorResults } from 'features/sampcac/detector_results.js';
import { MockSAMPCACStatus } from 'features/sampcac/mock_sampcac_natives.js';

import { kMemoryReadTimeoutMs } from 'features/sampcac/detector_manager.js';

describe('DetectorManager', (it, beforeEach) => {
    let gunther = null;
    let manager = null;
    let status = null;

    beforeEach(() => {
        const feature = server.featureManager.loadFeature('sampcac');

        gunther = server.playerManager.getById(/* Gunther= */ 0);
        manager = feature.manager_;
        status = new MockSAMPCACStatus();

        // Activates the |status| for |gunther|, so that operations work as expected.
        feature.natives_.setStatusForTesting(gunther, status);
    })

    it('is able to run a detection against a particular player', async (assert) => {
        const resultPromise = manager.detect(gunther);

        // Fast-forward since we can't mock all the memory addresses.
        await server.clock.advance(kMemoryReadTimeoutMs);

        const result = await resultPromise;

        assert.instanceOf(result, DetectorResults);
        assert.equal(result.version, '0.3.7-mock');
        assert.typeOf(result.sampcacVersion, 'string');
        assert.typeOf(result.sampcacHardwareId, 'string');
        assert.isFalse(result.minimized);

        assert.instanceOf(result.detectors, Map);
    });

    it('is able to request memory reads from players', async (assert) => {
        status.writeMemoryChecksum(0x43A4B0, 1337);
        status.writeMemory(0x867198, [ 0x61, 0x66, 0x72, 0x6F ]);  // afro

        // (1) Addresses in game code data time out when unanswered.
        const codeTimeout = manager.requestMemoryRead(gunther, 0x43A4A0, 4);

        await server.clock.advance(kMemoryReadTimeoutMs);

        assert.isNull(await codeTimeout);

        // (2) Addresses in game code data can be answered.
        const codeResponse = manager.requestMemoryRead(gunther, 0x43A4B0, 4);
        assert.equal(await codeResponse, 1337);

        // (3) Addresses outside of game code data time out when unanswered.
        const dataTimeout = manager.requestMemoryRead(gunther, 0x8670B8, 4);

        await server.clock.advance(kMemoryReadTimeoutMs);

        assert.isNull(await dataTimeout);

        // (4) Addresses outside of game code data can be answered.
        const dataResponse = manager.requestMemoryRead(gunther, 0x867198, 4);
        assert.deepEqual([ ...await dataResponse ], [ 0x61, 0x66, 0x72, 0x6F ]);  // afro

        // (5) Multiple simultaneous requests for the same address work fine.
        const firstRequest = manager.requestMemoryRead(gunther, 0x43A4B0, 4);
        const secondRequest = manager.requestMemoryRead(gunther, 0x43A4B0, 4);

        assert.deepEqual(await Promise.all([ firstRequest, secondRequest ]), [ 1337, 1337 ]);

        // (6) Requests should be aborted when a player disconnects.
        const disconnectedRequest = manager.requestMemoryRead(gunther, 0x8670B8, 4);

        gunther.disconnectForTesting();

        assert.isNull(await disconnectedRequest);
    });
});
