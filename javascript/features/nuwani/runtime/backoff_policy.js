// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The initial delay, in milliseconds, to wait before establishing a connection.
const kInitialDelayMs = 4000;

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
    failureCount_ = 0;
    initial_ = kInitialDelayMs;
    state_ = kPolicyStateInitial;

    // Returns the delay for the |attempt|th attempt.
    static CalculateDelayForAttempt(attempt, initial = kInitialDelayMs) {
        return Math.floor(
            kInitialDelayMs * Math.pow(kMultiplyFactor, Math.min(attempt, kMaximumFailureCount)));
    }
    
    constructor(initial = kInitialDelayMs) {
        this.initial_ = initial;
    }

    // Returns the time until the next request can be started, in milliseconds. The policy must not
    // be in RequestinProgress state, as the previous request attempt must first be acknowledged. 
    getTimeToNextRequestMs() {
        if (this.state_ === kPolicyStateRequestInProgress)
            throw new Error('Unable to progress policy state: request already in progress.');

        this.state_ = kPolicyStateRequestInProgress;
        return BackoffPolicy.CalculateDelayForAttempt(this.failureCount_);
    }

    // Marks the in-progress request as having succeeded. The failure count will be reset, which
    // means that any future requests will go through immediately.
    markRequestSuccessful() {
        if (this.state_ != kPolicyStateRequestInProgress)
            throw new Error('Unable to progress policy state: no request in progress.');
        
        this.failureCount_ = 0;
        this.state_ = kPolicyStateIdle;
    }

    // Marks the in-progress request as having failed. Time until the next request will be increased
    // and can hereafter be queried again.
    markRequestFailed() {
        if (this.state_ != kPolicyStateRequestInProgress)
            throw new Error('Unable to progress policy state: no request in progress.');
        
        this.failureCount_++;
        this.state_ = kPolicyStateIdle;
    }

    // Resets the backoff policy back to idle, when the request has been aborted before it actually
    // started. This could be the case due to the asynchronous nature of establishing connection.
    resetToIdle() {
        this.failureCount_ = 0;
        this.state_ = kPolicyStateIdle;
    }
}
