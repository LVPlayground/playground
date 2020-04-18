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

    connectionId_ = null;
    connectionToken_ = null;

    backoffPolicy_ = null;
    disposed_ = false;
    socket_ = null;

    constructor(servers, delegate) {
        this.servers_ = servers;
        this.delegate_ = delegate;

        this.connectionId_ = connectionId++;

        this.backoffPolicy_ = new BackoffPolicy();

        this.socket_ = new Socket('tcp');
        this.socket_.addEventListener('error', Connection.prototype.onSocketError.bind(this));
        this.socket_.addEventListener('message', Connection.prototype.onSocketMessage.bind(this));
    }
    
    // Starts trying to establish a connection with one of the network's servers. Will spin and wait
    // according to the backoff policy until its successful.
    async connect() {
        if (this.connectionToken_ !== null)
            throw new Error('A connection attempt is already in progress.');

        const connectionToken = Symbol('Connection token');
        const isCurrentAttempt = () => this.connectionToken_ === connectionToken;

        this.connectionToken_ = connectionToken;

        await wait(this.backoffPolicy_.getTimeToNextRequestMs());
        if (!isCurrentAttempt())
            return;

        let attempt = 0;

        do {
            const currentServerIndex = attempt % this.servers_.length;
            const ip = this.servers_[currentServerIndex].ip;
            const port = this.servers_[currentServerIndex].port;

            this.log(`Connecting to ${ip}:${port}...`);
            const connected = await this.socket_.open(ip, port, kConnectionTimeoutSec);

            if (!isCurrentAttempt()) {
                if (connected && this.disposed_)
                    this.socket_.close();

                return;
            }

            // Report the result to the back-off policy, to ensure that the next request will be
            // made with the appropriate time delay.
            connected ? this.backoffPolicy_.markRequestSuccessful()
                      : this.backoffPolicy_.markRequestFailed();

            if (connected) {
                this.log(`Connection to ${ip}:${port} succeeded.`);

                this.connectionToken_ = null;
                this.delegate_.onConnectionEstablished();
                return;
            }

            const delay = this.backoffPolicy_.getTimeToNextRequestMs();
            const delaySec = Math.floor(delay / 1000);

            this.log(`Connection to ${ip}:${port} failed. Next attempt in ${delaySec} seconds.`);
            this.delegate_.onConnectionFailed();

            await wait(delay);

            ++attempt;

        } while (isCurrentAttempt());
    }

    // Writes the given |message| to the connection. The |message| will be encoded as UTF-8, so
    // international characters are allowed.
    async write(message) {
        if (this.socket_.state !== 'connected')
            throw new Error('Illegal write to non-connected socket.');

        console.log('[IRC] >[' + message + ']');

        const buffer = stringToUtf8Buffer(message.trimEnd() + '\r\n');
        await this.socket_.write(buffer);
    }

    // Closes the connection currently established with the server, if any. In-progress connection
    // attempts themselves will be cancelled too, albeit with a delay.
    disconnect() {
        switch (this.socket_.state) {
            case 'disconnected':
                break;

            case 'connecting':
            case 'connected':
                this.socket_.close();
                break;
        }

        this.connectionToken_ = null;
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
        const messages = buffer.split(/\r?\n/);

        messages.forEach(message => {
            if (!message.length)
                return;

            this.delegate_.onConnectionMessage(message);
        });
    }

    // Logs the given |message| associated with this connection. The message will not be written to
    // the console when running tests, to avoid spewing a ton of output.
    log(message) {
        if (server.isTest())
            return;
        
        console.log('[Connection:' + this.connectionId_ + '] ' + message);
    }

    dispose() {
        this.connectionToken_ = null;
        this.disposed_ = true;
    }
}
