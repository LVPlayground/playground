// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { stringToUtf8Buffer, utf8BufferToString } from 'components/networking/utf-8.js';

// The global connetion Id, unique for each of the socket connections.
let globalConnectionId = 0;

// The latest instance of the MockSocket, used by the static getter on the class.
let globalLatestInstance = null;

// Mocked implementation of the Socket API made available by the PlaygroundJS plugin, which mimics
// being a WebSocket server that communicates in the same way Discord would.
export class MockSocket {
    // Returns the heartbeat interval that will be used by the mock socket.
    static getHeartbeatIntervalMs() { return 41250; }

    // Returns the most recent instance of the MockSocket that has been created.
    static getMostRecentInstance() { return globalLatestInstance; }

    // Behaviours that are supported by the mock socket, and can be toggled by tests.
    static kBehaviourFailFirstConnection = 1;

    // The opcodes that are supported by the mocked Discord connection.
    static kOpcodeDispatch = 0;
    static kOpcodeHeartbeat = 1;
    static kOpcodeHeartbeatAck = 11;
    static kOpcodeHello = 10;
    static kOpcodeIdentify = 2;
    static kOpcodeInvalidSession = 9;
    static kOpcodeReconnect = 7;
    static kOpcodeResume = 6;

    // States that the socket can be in. Returned by the state getter.
    static kStateConnected = 'connected';
    static kStateConnecting = 'connecting';
    static kStateDisconnecting = 'disconnecting';
    static kStateDisconnected = 'disconnected';

    #attempts_ = 0;
    #behaviour_ = new Set();
    #connectionId_ = null;
    #listeners_ = new Map();
    #state_ = MockSocket.kStateDisconnected;
    #wasResumption_ = false;

    constructor(protocol) {
        if (protocol !== 'websocket')
            throw new Error(`The MockSocket only expects to receive WebSocket connections.`);

        globalLatestInstance = this;
    }

    // ---------------------------------------------------------------------------------------------
    // Testing API
    // ---------------------------------------------------------------------------------------------

    // Gets the connection Id from the Socket. Will be able to tell if it got reconnected.
    get connectionId() { return this.#connectionId_; }

    // Gets whether the last connection was established based on a session resumption.
    get wasResumption() { return this.#wasResumption_; }

    // Enables the given |behaviour| on the mocked socket. Must be one of the above constants.
    enableBehaviour(behaviour) { this.#behaviour_.add(behaviour); }

    // Sends an opcode message to the socket, which are the low-level messages that Discord's API is
    // built on. Various will be sent in order to follow the connection's lifetime.
    async sendDelayedOpcodeMessage(microtasks, { op, d = {}, s = null, t = null } = {}) {
        for (let microtask = 0; microtask < microtasks; ++microtask)
            await Promise.resolve();

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

        this.#connectionId_ = ++globalConnectionId;
        this.#state_ = MockSocket.kStateConnected;
        this.#wasResumption_ = false;

        // https://discord.com/developers/docs/topics/opcodes-and-status-codes#gateway-opcodes
        // Discord sends the 10 HELLO command immediately after connecting.
        this.sendDelayedOpcodeMessage(2, {
            op: MockSocket.kOpcodeHello,
            d: { heartbeat_interval: MockSocket.getHeartbeatIntervalMs() }
        });

        return true;
    }

    async write(data) {
        const stringifiedMessage = utf8BufferToString(data);
        const message = JSON.parse(stringifiedMessage);

        switch (message.op) {
            case MockSocket.kOpcodeHeartbeat:
                this.sendDelayedOpcodeMessage(1, {
                    op: MockSocket.kOpcodeHeartbeatAck,
                });

                break;

            case MockSocket.kOpcodeIdentify:
            case MockSocket.kOpcodeResume:
                this.#wasResumption_ = message.op === MockSocket.kOpcodeResume;

                this.sendDelayedOpcodeMessage(1, {
                    op: MockSocket.kOpcodeDispatch,
                    t: 'READY',
                    s: 1,
                    d: {
                        v: 6,
                        session_id: '8e6534ca2389dd7d38a0dc85d8b44c11',
                        // many fields omitted for brevity
                    }
                });

                break;

            default:
                console.log('[Discord Mock] Unhandled message:', message);
                break;
        }

        return true;
    }

    async close() {
        const wasConnected = this.#state_ === MockSocket.kStateConnected;

        // Clear state before sending the `close` event, to avoid reentrancy issues.
        this.#state_ = MockSocket.kStateDisconnected;
        this.#connectionId_ = null;

        if (wasConnected)
            this.dispatchEvent('close');
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
