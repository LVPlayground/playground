// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The initial delay, in seconds, to wait before establishing a connection.
const kInitialDelaySec = 4;

// The multiplication factor to apply in each iteration of the backoff policy.
const kMultiplyFactor = 2;

// The maximum number of failures to consider before maxing out.
const kMaximumFailureCount = 7;

// States in which the BackoffPolicy can exist.
const kPolicyStateInitial = 0;
const kPolicyStateRequestInProgress = 1;
const kPolicyStateIdle = 2;

// Implements an exponential backoff policy for IRC connections, with a predefined delay for the
// initial connection as well. This makes sure that we won't hammer the IRC servers in case of
// problems, by waiting for an exponentially longer amount of time.
export class BackoffPolicy {
    failure_count_ = 0;
    state_ = kPolicyStateInitial;

    // Returns the initial delay, in seconds, that the policy will wait before opening a connection.
    static initialDelaySec() {
        return kInitialDelaySec;
    }
    
    // Returns the time until the next request can be started, in seconds. The policy must not be
    // in RequestinProgress state, as the previous request attempt must first be acknowledged. 
    getTimeToNextRequestSec() {
        if (this.state_ === kPolicyStateRequestInProgress)
            throw new Error('Unable to progress policy state: request already in progress.');

        let delay = kInitialDelaySec;
        if (this.state_ === kPolicyStateIdle)
            delay *= Math.pow(kMultiplyFactor, Math.min(this.failure_count_, kMaximumFailureCount));

        this.state_ = kPolicyStateRequestInProgress;
        return Math.floor(delay);
    }

    // Marks the in-progress request as having succeeded. The failure count will be reset, which
    // means that any future requests will go through immediately.
    markRequestSuccessful() {
        if (this.state_ != kPolicyStateRequestInProgress)
            throw new Error('Unable to progress policy state: no request in progress.');
        
        this.failure_count_ = 0;
        this.state_ = kPolicyStateIdle;
    }

    // Marks the in-progress request as having failed. Time until the next request will be increased
    // and can hereafter be queried again.
    markRequestFailed() {
        if (this.state_ != kPolicyStateRequestInProgress)
            throw new Error('Unable to progress policy state: no request in progress.');
        
        this.failure_count_++;
        this.state_ = kPolicyStateIdle;
    }
}
