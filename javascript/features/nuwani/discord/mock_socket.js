// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { stringToUtf8Buffer, utf8BufferToString } from 'components/networking/utf-8.js';

// The latest instance of the MockSocket, used by the static getter on the class.
let latestInstance = null;

// Mocked implementation of the Socket API made available by the PlaygroundJS plugin, which mimics
// being a WebSocket server that communicates in the same way Discord would.
export class MockSocket {
    // Returns the heartbeat interval that will be used by the mock socket.
    static getHeartbeatIntervalMs() { return 41250; }

    // Returns the most recent instance of the MockSocket that has been created.
    static getMostRecentInstance() { return latestInstance; }

    // Behaviours that are supported by the mock socket, and can be toggled by tests.
    static kBehaviourFailFirstConnection = 1;

    // The opcodes that are supported by the mocked Discord connection.
    static kOpcodeHeartbeat = 1;
    static kOpcodeHeartbeatAck = 11;
    static kOpcodeHello = 10;

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

    // Sends an opcode message to the socket, which are the low-level messages that Discord's API is
    // built on. Various will be sent in order to follow the connection's lifetime.
    sendOpcodeMessage({ op, d = {}, s = null, t = null } = {}) {
        const message = JSON.stringify({ op, d, s, t });
        const encodedMessage = stringToUtf8Buffer(message);

        this.dispatchEvent('message', { data: encodedMessage });
    }

    // ---------------------------------------------------------------------------------------------
    // Socket API
    // ---------------------------------------------------------------------------------------------

    get state() { return this.#state_; }

    async open(options) {
        if (!this.#attempts_++ && this.#behaviour_.has(MockSocket.kBehaviourFailFirstConnection))
            return false;

        this.#state_ = MockSocket.kStateConnected;

        // https://discord.com/developers/docs/topics/opcodes-and-status-codes#gateway-opcodes
        // Discord sends the 10 HELLO command immediately after connecting.
        Promise.resolve().then(() => {
            this.sendOpcodeMessage({
                op: MockSocket.kOpcodeHello,
                d: { heartbeat_interval: MockSocket.getHeartbeatIntervalMs() }
            });
        });

        return true;
    }

    async write(data) {
        const stringifiedMessage = utf8BufferToString(data);
        const message = JSON.parse(stringifiedMessage);

        switch (message.op) {
            case MockSocket.kOpcodeHeartbeat:
                this.sendOpcodeMessage({
                    op: MockSocket.kOpcodeHeartbeatAck,
                });

                break;

            default:
                console.log('[Discord Mock] Unhandled message:', message);
                break;
        }

        return true;
    }

    async close() {
        if (this.#state_ === MockSocket.kStateConnected)
            this.dispatchEvent('close');

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

    dispatchEvent(event, data = undefined) {
        const listeners = this.#listeners_.get(event);
        for (const listener of listeners || [])
            listener.call(null, data);
    }
}
