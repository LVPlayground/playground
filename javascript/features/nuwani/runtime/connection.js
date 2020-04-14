// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { BackoffPolicy } from 'features/nuwani/runtime/backoff_policy.js';

// Number of seconds to wait before considering a connection as having failed.
const kConnectionTimeoutSec = 10;

// The Connection class wraps the actual TCP Socket that's used to establish a connection with
// the IRC server, and provides functionality for features such as automatic reconnections.
export class Connection {
    delegate_ = null;
    servers_ = null;

    backoffPolicy_ = null;
    disposed_ = false;
    socket_ = null;

    constructor(delegate, servers) {
        this.delegate_ = delegate;
        this.servers_ = servers;

        this.backoffPolicy_ = new BackoffPolicy();
        this.socket_ = new Socket('tcp');
    }
    
    // Starts trying to establish a connection with one of the network's servers. Will spin and wait
    // according to the backoff policy until its successful.
    async connect() {
        let attempt = 0;

        do {
            await wait(this.backoffPolicy_.getTimeToNextRequestMs());
            if (this.disposed_)
                return;

            const currentServerIndex = attempt % this.servers_.length;
            const ip = this.servers_[currentServerIndex].ip;
            const port = this.servers_[currentServerIndex].port;

            const connected = await this.socket_.open(ip, port, kConnectionTimeoutSec);
            connected ? this.backoffPolicy_.markRequestSuccessful()
                      : this.backoffPolicy_.markRequestFailed();

            if (connected) {
                this.delegate_.onConnectionEstablished();
                return;
            }

            this.delegate_.onConnectionFailed();
            ++attempt;

        } while (!this.disposed_);
    }

    dispose() {
        this.disposed_ = true;
    }
}
