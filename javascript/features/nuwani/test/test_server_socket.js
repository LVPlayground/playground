// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The existing instance of the TestServerSocket class, if any, as well as the existing global
// Socket object that existed at time of class creation.
let existingInstance = null;
let existingSocket = null;

// The TestServerSocket can be created by tests to override the global Socket object with a custom
// one that implements a basic IRC server for testing purposes. Only a single instance of the
// TestServerSocket class may exist at any time.
export class TestServerSocket {
    // Magic port value that can be used to trigger a failed connection.
    static kFailurePort = 26667;

    #sockets_ = [];

    constructor() {
        if (existingInstance !== null)
            throw new Error('An instance of the TestServerSocket already exists.');

        existingInstance = this;
        existingSocket = Socket;

        Socket = TestSocket;
    }

    // Gets the array of sockets that have been opened thus far.
    get sockets() { return this.#sockets_; }

    // To be called when a new socket has been opened.
    registerSocket(socket) {
        this.#sockets_.push(socket);
    }

    dispose() {
        Socket = existingSocket;

        this.#sockets_ = [];

        existingInstance = null;
        existingSocket = null;
    }
}

// Mock implementation of the Socket module, normally provided by PlaygroundJS. Should be kept
// in sync, and exercise the same behaviour as the C++ plugin's implementation.
class TestSocket {
    #protocol_ = null;
    #state_ = null;

    #error_listeners_ = new Set();
    #message_listeners_ = new Set();

    // Values exposed for testing purposes only, these do not exist on the actual implementation.
    ipForTesting = null;
    portForTesting = null;

    // [Constructor(string protocol)]
    constructor(protocol) {
        if (!['tcp', 'udp'].includes(protocol.toLowerCase()))
            throw new Error('Invalid protocol provided: ' + protocol);
        
        this.#protocol_ = protocol;
        this.#state_ = 'disconnected';

        existingInstance.registerSocket(this);
    }

    // Promise<boolean> open(string ip, number port[, number timeout]);
    async open(ip, port, timeout) {
        if (this.#state_ !== 'disconnected')
            throw new Error('Illegal to call open() if a live connection already exists.');

        if (port === TestServerSocket.kFailurePort) {
            this.#state_ = 'disconnected';
            return false;
        }

        this.ipForTesting = ip;
        this.portForTesting = port;

        this.#state_ = 'connected';
        return true;
    }

    // Promise<boolean> write(ArrayBuffer data);
    async write(data) {
        return true;
    }

    // void addEventListener(string event, function listener);
    addEventListener(event, listener) {
        switch (event) {
            case 'error':
                this.#error_listeners_.add(listener);
                break;
            case 'message':
                this.#message_listeners_.add(listener);
                break;
            default:
                throw new Error('Invalid event listener specified: ' + event);
        }
    }

    // void removeEventListener(string event, function listener);
    removeEventListener(event, listener) {
        switch (event) {
            case 'error':
                this.#error_listeners_.delete(listener);
                break;
            case 'message':
                this.#message_listeners_.delete(listener);
                break;
            default:
                throw new Error('Invalid event listener specified: ' + event);
        }
    }

    // void close();
    close() {
        this.ipForTesting = null;
        this.portForTesting = null;

        this.#state_ = 'disconnected';
    }

    // readonly attribute string protocol;
    get protocol() { return this.#protocol_; }

    // readonly attribute string state;
    get state() { return this.#state_; }
}
