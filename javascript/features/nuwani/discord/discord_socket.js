// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { BackoffPolicy } from 'features/nuwani/runtime/backoff_policy.js';
import { MockSocket } from 'features/nuwani/discord/mock_socket.js';
import { URL } from 'components/networking/url.js';

import { stringToUtf8Buffer, utf8BufferToString } from 'components/networking/utf-8.js';

// The socket interface that's expected to maintain the connection with Discord over WebSockets.
// Will establish the connection as soon as feasible. Interacts with the BackoffPolicy to avoid
// hammering the Discord servers when there is an issue on either end.
export class DiscordSocket {
    // States that the Socket can be in. Match the Socket API.
    static kStateConnected = 'connected';
    static kStateConnecting = 'connecting';
    static kStateDisconnecting = 'disconnecting';
    static kStateDisconnected = 'disconnected';

    #backoffPolicy_ = null;
    #connectionToken_ = null;
    #delegate_ = null;
    #disposed_ = false;
    #socket_ = null;

    constructor(delegate) {
        this.#backoffPolicy_ = new BackoffPolicy();
        this.#delegate_ = delegate;
        this.#socket_ = server.isTest() ? new MockSocket('websocket')
                                        : new Socket('websocket');

        // Attach the event listeners so that we're aware of events on the socket.
        this.#socket_.addEventListener('close', DiscordSocket.prototype.onClose.bind(this));
        this.#socket_.addEventListener('error', DiscordSocket.prototype.onError.bind(this));
        this.#socket_.addEventListener('message', DiscordSocket.prototype.onMessage.bind(this));
    }

    // Gets the current state of the socket.
    get state() { return this.#socket_.state; }

    // ---------------------------------------------------------------------------------------------
    // Section: connection management
    // ---------------------------------------------------------------------------------------------

    // Connects to Discord at the given |endpoint|, which must be a string containing a URL from
    // which the necessary data will be extracted. Will wait according to the backoff policy.
    async connect(endpoint) {
        if (this.#connectionToken_ !== null)
            throw new Error(`A connection attempt is already in progress.`);

        const connectionToken = Symbol('Discord connection');
        const endpointUrl = new URL(endpoint);

        // Store the connection token, so that we can detect duplicate connection attempts.
        this.#connectionToken_ = connectionToken;

        // Wait for the initial back-off per the policy, to delay the initial connection.
        await wait(this.#backoffPolicy_.getTimeToNextRequestMs());

        if (this.#connectionToken_ !== connectionToken || this.#disposed_)
            return this.#backoffPolicy_.resetToIdle();

        let attempt = 0;
        do {
            this.log(`Connecting to ${endpoint}...`);

            // Try to establish the actual connection. Discord always uses TLS v1.2, so we hardcode
            // that part, but interpret the rest of the data from the |endpointUrl|.
            const connected = await this.#socket_.open({
                host: endpointUrl.hostname,
                path: `/${endpointUrl.pathname || ''}?${endpointUrl.search || ''}`,
                port: endpointUrl.port,
                ssl: 'tlsv12',
            });

            // Report the result to the back-off policy, to ensure that the next request will be
            // made with the appropriate time delay. That depends on the attempt's result.
            connected ? this.#backoffPolicy_.markRequestSuccessful()
                      : this.#backoffPolicy_.markRequestFailed();

            if (this.#connectionToken_ !== connectionToken) {
                if (connected && this.#disposed_)
                    await this.#socket_.close();

                return;
            }

            // If the connection attempt was successful, log this to the console, reset the token
            // and let the delegate know that the connection was established.
            if (connected) {
                this.log(`Connection to ${endpoint} succeeded.`);

                this.#connectionToken_ = null;
                this.#delegate_.onConnectionEstablished();
                return;
            }

            const delay = this.#backoffPolicy_.getTimeToNextRequestMs();
            const delaySec = Math.floor(delay / 1000);

            this.log(`Connection to ${endpoint} failed. Next attempt in ${delaySec} seconds.`);
            this.#delegate_.onConnectionFailed();

            await wait(delay);

            if (this.#connectionToken_ !== connectionToken)
                this.#backoffPolicy_.resetToIdle();

            ++attempt;

        } while (this.#connectionToken_ === connectionToken && !this.#disposed_);
    }

    // Asynchronously writes a message to the Discord socket. A promise will be returned that will
    // be resolved once the |message| has been sent to the socket successfully.
    async write(message) {
        const stringifiedMessage = JSON.stringify(message);
        const encodedMessage = stringToUtf8Buffer(stringifiedMessage);

        return this.#socket_.write(encodedMessage);
    }

    // Immediately closes the connection when this was currently established, or when a connection
    // attempt is currently in progress. This is safe to be called at any time.
    async disconnect() {
        if (this.#disposed_)
            return;  // the socket already has been disposed of

        switch (this.#socket_.state) {
            case DiscordSocket.kStateConnecting:
            case DiscordSocket.kStateConnected:
            case DiscordSocket.kStateDisconnecting:
                this.#socket_.close();
                break;
        }

        this.#connectionToken_ = null;
    }

    // ---------------------------------------------------------------------------------------------
    // Section: events triggered by the Socket
    // ---------------------------------------------------------------------------------------------

    // Called when the connection has been closed, after having been established. The delegate will
    // be told about this, and any existing connection attempt will be voided.
    onClose(event) {
        if (this.#disposed_)
            return;

        this.#connectionToken_ = null;
        this.#delegate_.onConnectionClosed();
    }

    // Called when an error has been seen from the underlying socket. The connection will be closed
    // immediately if it's currently established, as no further operation can happen anymore.
    onError(event) {
        if (this.#disposed_)
            return;

        this.log(`Error ${event.code}: ${event.message}`);

        if (this.socket_.state !== 'connected')
            return;

        this.disconnect();
    }

    // Called when a message has been received by the socket. The message's data is given to us as
    // a UTF-8 string contained in an ArrayBuffer, which contains the JSON payload per the API.
    onMessage(event) {
        if (this.#disposed_)
            return;

        const buffer = utf8BufferToString(event.data);

        let message = null;
        try {
            message = JSON.parse(buffer);
        } catch (exception) {
            this.log(`Received invalid message: ${buffer}`);
            return;
        }

        this.#delegate_.onMessage(message);
    }

    // ---------------------------------------------------------------------------------------------

    // Helper function to log progression on the connection. Will be prefixed to identify the socket
    // and will be muted entirely when running tests, to avoid spam.
    log(message, ...params) {
        if (!server.isTest())
            console.log(`[Discord] ` + message, ...params);
    }

    dispose() {
        this.#connectionToken_ = null;
        this.#disposed_ = true;
    }
}
