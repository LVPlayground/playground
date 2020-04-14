// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { BackoffPolicy } from 'features/nuwani/runtime/backoff_policy.js';

describe('BackoffPolicy', it => {
    const kInitialDelay = BackoffPolicy.initialDelaySec();

    it('should always issue the initial waiting delay first', assert => {
        const policy = new BackoffPolicy();

        assert.equal(policy.getTimeToNextRequestSec(), kInitialDelay);
    });

    it('should reset once a successful attempt has been reported', assert => {
        const policy = new BackoffPolicy();

        assert.equal(policy.getTimeToNextRequestSec(), kInitialDelay);
        policy.markRequestFailed();

        assert.isAbove(policy.getTimeToNextRequestSec(), kInitialDelay);
        policy.markRequestSuccessful();

        assert.equal(policy.getTimeToNextRequestSec(), kInitialDelay);
    });

    it('should follow a capped, exponential rate of increase', assert => {
        const policy = new BackoffPolicy();
        const expected = [
            4,  // initial delay
            8,
            16,
            32,
            64,
            128,
            256,
            512,  // terminal value
            512,
        ];

        for (let iteration = 0; iteration < expected.length; ++iteration) {
            assert.equal(policy.getTimeToNextRequestSec(), expected[iteration]);
            policy.markRequestFailed();
        }
    });

    it('should not allow requesting time before making the previous one as finished', assert => {
        const policy = new BackoffPolicy();

        policy.getTimeToNextRequestSec()
        assert.throws(() => policy.getTimeToNextRequestSec());
        
        policy.markRequestFailed();
        assert.doesNotThrow(() => policy.getTimeToNextRequestSec());
    });

    it('should not allow marking a request as finished before having started it', assert => {
        const policy = new BackoffPolicy();

        assert.throws(() => policy.markRequestFailed());
        assert.throws(() => policy.markRequestSuccessful());
    });
});
