// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Symbol to restrict `LimitsDecision` from being constructed by anything but code in this file.
const kPrivateSymbol = Symbol();

// Represents a decision made by the LimitsDecider. Can be converted to and used as a string for
// display purposes, but also be inspected for the individual requirements.
export class LimitsDecision {
    // Creates an approval. No further message is needed.
    static createApproval() { return new LimitsDecision(kPrivateSymbol, /* approved= */ true); }

    // Creates a rejection. A reason for rejection is required.
    static createRejection(reason) {
        return new LimitsDecision(kPrivateSymbol, /* approved= */ false, reason);
    }

    approved_ = null;
    reason_ = null;

    constructor(privateSymbol, approved, reason = null) {
        if (privateSymbol !== kPrivateSymbol)
            throw new Error(`Please use one of the static methods to create a decision.`);

        this.approved_ = approved;
        this.reason_ = reason;
    }

    // Returns whether the decision has been approved.
    isApproved() { return this.approved_; }

    // Converts |this| to a string that's ready to be consumed by players.
    toString() { return this.approved_ ? '[LimitsDecision approved]' : this.reason_; }
}
