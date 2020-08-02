// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The latest instance of the MockSocket, used by the static getter on the class.
let latestInstance = null;

// Mocked implementation of the Socket API made available by the PlaygroundJS plugin, which mimics
// being a WebSocket server that communicates in the same way Discord would.
export class MockSocket {
    // Returns the most recent instance of the MockSocket that has been created.
    static getMostRecentInstance() { return latestInstance; }

    // Behaviours that are supported by the mock socket, and can be toggled by tests.
    static kBehaviourFailFirstConnection = 1;

    // States that the socket can be in. Returned by the state getter.
    static kStateConnected = 'connected';
    static kStateConnecting = 'connecting';
    static kStateDisconnecting = 'disconnecting';
    static kStateDisconnected = 'disconnected';

    #attempts_ = 0;
    #behaviour_ = new Set();
    #listeners_ = new Map();
    #state_ = MockSocket.kStateDisconnected;

    constructor(protocol) {
        if (protocol !== 'websocket')
            throw new Error(`The MockSocket only expects to receive WebSocket connections.`);

        latestInstance = this;
    }

    // ---------------------------------------------------------------------------------------------
    // Testing API
    // ---------------------------------------------------------------------------------------------

    // Enables the given |behaviour| on the mocked socket. Must be one of the above constants.
    enableBehaviour(behaviour) { this.#behaviour_.add(behaviour); }

    // ---------------------------------------------------------------------------------------------
    // Socket API
    // ---------------------------------------------------------------------------------------------

    get state() { return this.#state_; }

    async open(options) {
        if (!this.#attempts_++ && this.#behaviour_.has(MockSocket.kBehaviourFailFirstConnection))
            return false;

        this.#state_ = MockSocket.kStateConnected;
        return true;
    }

    async write(data) { return false; }

    async close() {
        this.#state_ = MockSocket.kStateDisconnected;
    }

    // ---------------------------------------------------------------------------------------------
    // EventTarget
    // ---------------------------------------------------------------------------------------------

    addEventListener(event, listener) {
        if (!this.#listeners_.has(event))
            this.#listeners_.set(event, new Set());

        this.#listeners_.get(event).add(listener);
    }

    dispatchEvent(event, data) {
        const listeners = this.#listeners_.get(event);
        for (const listener of listeners || [])
            listener.call(null, data);
    }
}
