// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { BackoffPolicy } from 'features/nuwani/runtime/backoff_policy.js';

describe('BackoffPolicy', it => {
    const kInitialDelay = BackoffPolicy.CalculateDelayForAttempt(0);

    it('should always issue the initial waiting delay first', assert => {
        const policy = new BackoffPolicy();

        assert.equal(policy.getTimeToNextRequestMs(), kInitialDelay);
    });

    it('should reset once a successful attempt has been reported', assert => {
        const policy = new BackoffPolicy();

        assert.equal(policy.getTimeToNextRequestMs(), kInitialDelay);
        policy.markRequestFailed();

        assert.isAbove(policy.getTimeToNextRequestMs(), kInitialDelay);
        policy.markRequestSuccessful();

        assert.equal(policy.getTimeToNextRequestMs(), kInitialDelay);
    });

    it('should follow a capped, exponential rate of increase', assert => {
        const policy = new BackoffPolicy();
        const expected = [
            4000,    // 4 seconds, initial delay
            8000,    // 8 seconds
            16000,   // 16 seconds
            32000,   // 32 seconds
            64000,   // 1:04 minutes
            128000,  // 2:08 minutes
            256000,  // 4:16 minutes
            512000,  // 8:32 minutes, terminal value
            512000,  // 8:32 minutes
        ];

        for (let iteration = 0; iteration < expected.length; ++iteration) {
            assert.equal(policy.getTimeToNextRequestMs(), expected[iteration]);
            policy.markRequestFailed();
        }
    });

    it('should not allow requesting time before making the previous one as finished', assert => {
        const policy = new BackoffPolicy();

        policy.getTimeToNextRequestMs()
        assert.throws(() => policy.getTimeToNextRequestMs());
        
        policy.markRequestFailed();
        assert.doesNotThrow(() => policy.getTimeToNextRequestMs());
    });

    it('should not allow marking a request as finished before having started it', assert => {
        const policy = new BackoffPolicy();

        assert.throws(() => policy.markRequestFailed());
        assert.throws(() => policy.markRequestSuccessful());
    });
});
