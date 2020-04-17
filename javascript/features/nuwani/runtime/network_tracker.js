// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The network tracker keeps track of state across the network, which channels are joined by
// the bot, and which users are on those channels with which access levels.
export class NetworkTracker {
    settings_ = null;

    constructor() {
        this.support_ = new Map();
    }

    // Returns the support |rule|'s value, the boolean true when it's a flag, or null when unknown.
    getSupportRule(rule) { return this.support_.get(rule); }

    // Handles the given |message|. The network tracker will only inspect incoming messages, and
    // adjust our internal state based on what's learned through them.
    handleMessage(message) {
        switch (message.command) {
            case '005':  // RPL_ISUPPORT
                for (const param of message.params) {
                    const [rule, value] = param.split('=');

                    // Ignore rule that aren't in uppercase, as descriptive text usually follows.
                    if (rule !== rule.toUpperCase())
                        continue;

                    this.support_.set(rule, value || true);
                }

                break;
        }
    }

    // Resets the network tracker to a default state. This should generally be called when the
    // connection with the server has been closed, and will be restarting soon.
    reset() {
        this.support_ = new Map();
    }

    dispose() {
        this.support_ = null;
    }
}
