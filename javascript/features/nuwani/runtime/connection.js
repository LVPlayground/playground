// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { BackoffPolicy } from 'features/nuwani/runtime/backoff_policy.js';
import { stringToUtf8Buffer, utf8BufferToString } from 'features/nuwani/runtime/encoding.js';

// Number of seconds to wait before considering a connection as having failed.
const kConnectionTimeoutSec = 10;

// Global connection counter allowing log messages to be associated with each other.
let connectionId = 1;

// The Connection class wraps the actual TCP Socket that's used to establish a connection with
// the IRC server, and provides functionality for features such as automatic reconnections.
//
// This class must be given a delegate on construction, which will receive higher level events
// associated with activity on the socket. The following methods must exist:
//
// * onConnectionFailed()
// * onConnectionEstablished()
// * onConnectionMessage(string message)
// * onConnectionClosed()
//
// Reconnection attempts, as well as socket-level logging, will be done by this class.
export class Connection {
    delegate_ = null;
    servers_ = null;

    backoffPolicy_ = null;
    socket_ = null;

    connection_id_ = null;
    disposed_ = false;

    constructor(servers, delegate) {
        this.servers_ = servers;
        this.delegate_ = delegate;

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
        if (this.disposed_)
            return;

        do {
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

    // Writes the given |message| to the connection. The |message| will be encoded as UTF-8, so
    // international characters are allowed.
    async write(message) {
        if (this.socket_.state !== 'connected')
            throw new Error('Illegal write to non-connected socket.');
        
        const buffer = stringToUtf8Buffer(message);
        await this.socket_.write(buffer);
    }

    // Called when an error occurs on the socket that backs the connection. Most errors will require
    // the connection to be closed and reset, which will be initiated by this method.
    onSocketError(event) {
        this.log(`Error ${event.code}: ${event.message}`);

        if (this.socket_.state === 'disconnected')
            return;

        this.delegate_.onConnectionClosed();
        this.socket_.close();
    }

    // Called when data has been received from the socket. Each event may contain one or multiple
    // messages that will be forwarded to the Bot.
    onSocketMessage(event) {
        const buffer = utf8BufferToString(event.data);
        const messages = buffer.split('\n');

        messages.forEach(message =>
            this.delegate_.onConnectionMessage(message));
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
