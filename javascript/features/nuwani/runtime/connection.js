// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { BackoffPolicy } from 'features/nuwani/runtime/backoff_policy.js';

// Number of seconds to wait before considering a connection as having failed.
const kConnectionTimeoutSec = 10;

// Global connection counter allowing log messages to be associated with each other.
let connectionId = 1;

// The Connection class wraps the actual TCP Socket that's used to establish a connection with
// the IRC server, and provides functionality for features such as automatic reconnections.
export class Connection {
    delegate_ = null;
    servers_ = null;

    backoffPolicy_ = null;
    socket_ = null;

    connection_id_ = null;
    disposed_ = false;

    constructor(delegate, servers) {
        this.delegate_ = delegate;
        this.servers_ = servers;

        this.backoffPolicy_ = new BackoffPolicy();

        this.socket_ = new Socket('tcp');
        this.socket_.addEventListener('error', Connection.prototype.onSocketError.bind(this));
        this.socket_.addEventListener('message', Connection.prototype.onSocketMessage.bind(this));

        this.connection_id_ = connectionId++;
    }
    
    // Starts trying to establish a connection with one of the network's servers. Will spin and wait
    // according to the backoff policy until its successful.
    async connect() {
        let attempt = 0;

        await wait(this.backoffPolicy_.getTimeToNextRequestMs());

        do {
            if (this.disposed_)
                return;

            const currentServerIndex = attempt % this.servers_.length;
            const ip = this.servers_[currentServerIndex].ip;
            const port = this.servers_[currentServerIndex].port;

            this.log(`Connecting to ${ip}:${port}...`);
            const connected = await this.socket_.open(ip, port, kConnectionTimeoutSec);

            if (this.disposed_) {
                if (connected)
                    this.socket_.close();
                
                return;
            }

            // Report the result to the back-off policy, to ensure that the next request will be
            // made with the appropriate time delay.
            connected ? this.backoffPolicy_.markRequestSuccessful()
                      : this.backoffPolicy_.markRequestFailed();

            if (connected) {
                this.log(`Connection to ${ip}:${port} succeeded.`);
                this.delegate_.onConnectionEstablished();
                return;
            }

            const delay = this.backoffPolicy_.getTimeToNextRequestMs();
            const delaySec = Math.floor(delay / 1000);

            this.log(`Connection to ${ip}:${port} failed. Next attempt in ${delaySec} seconds.`);
            this.delegate_.onConnectionFailed();

            await wait(delay);

            ++attempt;

        } while (!this.disposed_);
    }

    // Called when an error occurs on the socket that backs the connection. Most errors will require
    // the connection to be closed and reset, which will be initiated by this method.
    onSocketError(event) {
        this.log(`Error ${event.code}: ${event.message}`);

        // Close the socket if it hasn't closed itself already.
        if (this.socket_.state !== 'disconnected')
            this.socket_.close();

        // TODO: Should we automatically reconnect to the server here?
    }

    // Called when data has been received from the socket. Each event may contain one or multiple
    // messages that will be forwarded to the Bot.
    onSocketMessage(event) {
        
    }

    // Logs the given |message| associated with this connection. The message will not be written to
    // the console when running tests, to avoid spewing a ton of output.
    log(message) {
        if (server.isTest())
            return;
        
        console.log('[Connection:' + this.connection_id_ + '] ' + message);
    }

    dispose() {
        this.disposed_ = true;
    }
}
