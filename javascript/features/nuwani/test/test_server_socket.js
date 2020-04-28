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

    sockets_ = [];

    constructor() {
        if (existingInstance !== null)
            throw new Error('An instance of the TestServerSocket already exists.');

        existingInstance = this;
        existingSocket = Socket;

        Socket = TestSocket;
    }

    // Gets the array of sockets that have been opened thus far.
    get sockets() { return this.sockets_; }

    // To be called when a new socket has been opened.
    registerSocket(socket) {
        this.sockets_.push(socket);
    }

    dispose() {
        Socket = existingSocket;

        this.sockets_ = [];

        existingInstance = null;
        existingSocket = null;
    }
}

// Mock implementation of the Socket module, normally provided by PlaygroundJS. Should be kept
// in sync, and exercise the same behaviour as the C++ plugin's implementation.
class TestSocket {
    state_ = null;
    listeners_ = null;
    options_ = null;

    // Options are exposed for testing purposes only, normal Sockets do not provide this accessor.
    get optionsForTesting() { return this.options_; }

    // readonly attribute string state;
    get state() { return this.state_; }

    // [Constructor(string protocol)]
    constructor(protocol) {
        if (typeof protocol !== 'string')
            throw new Error('The |protocol| must be a string.');

        if (!['tcp'].includes(protocol))
            throw new Error('Invalid protocol provided: ' + options.protocol);

        this.state_ = 'disconnected';
        this.listeners_ = new Map([
            ['close',   new Set()],
            ['error',   new Set()],
            ['message', new Set()],
        ]);

        existingInstance.registerSocket(this);
    }

    // Promise<boolean> open(SocketOpenOptions options);
    async open(options) {
        switch (this.state_) {
            case 'connecting':
            case 'connected':
            case 'disconnecting':
                throw new Error('Unable to open the socket: there already is an active connection.');
            
            case 'disconnected':
                break;
        }

        this.options_ = options;

        if (options.port === TestServerSocket.kFailurePort)
            return false;

        this.state_ = 'connected';
        return true;
    }

    // Promise<boolean> write(ArrayBuffer data);
    async write(data) {
        switch (this.state_) {
            case 'connecting':
            case 'disconnecting':
            case 'disconnected':
                throw new Error('Unable to write data to the socket: this requires an active connection.');
            
            case 'connected':
                break;
        }

        return true;
    }

    // Promise<void> close();
    async close() {
        switch (this.state_) {
            case 'disconnected':
                throw new Error('Unable to close the socket: this requires a connection.');
            
            case 'connecting':
            case 'disconnecting':
            case 'connected':
                break;
        }

        this.state_ = 'disconnected';
        this.options_ = null;

        await Promise.resolve();  // introduce asynchronousity

        for (const listener of this.listeners_.get('close'))
            listener();
    }

    // void addEventListener(string event, function listener);
    addEventListener(event, listener) {
        if (!this.listeners_.has(event))
            throw new Error('Invalid event name: ' + event);
        
        this.listeners_.get(event).add(listener);
    }

    // void removeEventListener(string event, function listener);
    removeEventListener(event, listener) {
        if (!this.listeners_.has(event))
            throw new Error('Invalid event name: ' + event);
        
        this.listeners_.get(event).delete(listener);
    }
}
