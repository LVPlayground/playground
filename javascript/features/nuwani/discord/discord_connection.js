// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { DiscordSocket } from 'features/nuwani/discord/discord_socket.js';

// Implements support for the mid-level Discord connection, building directly on the WebSocket. Will
// interpret the Gateway protocol and do what's necessary in order to keep it alive.
//
// https://discord.com/developers/docs/topics/gateway
export class DiscordConnection {
    #configuration_ = null;
    #connect_ = false;
    #connected_ = false;
    #socket_ = null;

    constructor(configuration) {
        this.#configuration_ = configuration;
        this.#socket_ = new DiscordSocket(this);
    }

    // ---------------------------------------------------------------------------------------------
    // Section: Connection management
    // ---------------------------------------------------------------------------------------------

    // Establishes connection with Discord. Will continue to try to keep a connection established,
    // even when the connection with the server drops for any reason.
    async connect() {
        this.#connect_ = true;
        return this.#socket_.connect(this.#configuration_.endpoint);
    }

    // Returns whether the connection is currently established.
    isConnected() { return this.#connected_; }

    // Disconnects the connection with Discord. Safe to call at any time, even when the connection
    // is not currently established (e.g. because of on-going network issues).
    async disconnect() {
        this.#connect_ = false;
        return this.#socket_.disconnect();
    }

    // ---------------------------------------------------------------------------------------------
    // Section: Socket delegate
    // ---------------------------------------------------------------------------------------------

    // Called when the connection with Discord has been closed for any reason. A reconnection
    // attempt can be started by |this| class in response, if one is still desired.
    onConnectionClosed() { this.#connected_ = false; }

    // Called when the connection with Discord has been established.
    onConnectionEstablished() { this.#connected_ = true; }

    // Called when the a connection attempt with Discord has failed. The DiscordSocket will continue
    // to try to establish a connection, following an exponential back-off.
    onConnectionFailed() {}

    // Called when a message has been received from Discord. This is a JavaScript object that
    // follows the Gateway Payload Structure from the Discord API.
    onMessage(message) {
        console.log(message);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.#socket_.disconnect();

        this.#socket_.dispose();
        this.#socket_ = null;
    }
}
