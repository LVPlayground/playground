// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { DiscordSocket } from 'features/nuwani/discord/discord_socket.js';

// The maximum number of invalid sessions we'll endure before giving up.
const kMaximumInvalidSessions = 2;

// Minimum interval at which the heartbeat monitor is willing to run, to not spam the server.
const kMinimumHeartbeatMonitorMs = 10 * 1000;

// Implements support for the mid-level Discord connection, building directly on the WebSocket. Will
// interpret the Gateway protocol and do what's necessary in order to keep it alive.
//
// https://discord.com/developers/docs/topics/gateway
export class DiscordConnection {
    // The opcodes that are supported by this level of the Discord connection.
    static kOpcodeDispatch = 0;
    static kOpcodeHeartbeat = 1;
    static kOpcodeHeartbeatAck = 11;
    static kOpcodeHello = 10;
    static kOpcodeIdentify = 2;
    static kOpcodeInvalidSession = 9;
    static kOpcodeReconnect = 7;
    static kOpcodeResume = 6;

    #authenticated_ = false;
    #configuration_ = null;
    #connect_ = false;
    #connected_ = false;
    #connecting_ = false;
    #delegate_ = null;
    #heartbeatAckTime_ = null;
    #heartbeatIntervalMs_ = null;
    #heartbeatMonitorToken_ = null;
    #invalidSessionCounter_ = 0;
    #sessionId_ = null;
    #sessionSequence_ = null;
    #socket_ = null;

    constructor(configuration, delegate) {
        this.#configuration_ = configuration;
        this.#delegate_ = delegate;
        this.#socket_ = new DiscordSocket(this);
    }

    // Gets the most recent ack time for the heartbeat, only valid for testing purposes.
    get hearbeatAckTimeForTesting() { return this.#heartbeatAckTime_; }

    // ---------------------------------------------------------------------------------------------
    // Section: Connection management
    // ---------------------------------------------------------------------------------------------

    // Returns whether the connection is currently established.
    isConnected() { return this.#connected_; }

    // Returns whether the connection is currently authenticated and ready for use.
    isAuthenticated() { return this.#authenticated_; }

    // Establishes connection with Discord. Will continue to try to keep a connection established,
    // even when the connection with the server drops for any reason. Should not be waited on.
    async connect() {
        this.#connect_ = true;

        if (!this.#connecting_ && !this.#connected_)
            return await this.#socket_.connect(this.#configuration_.endpoint);
    }

    // Disconnects the connection with Discord. Safe to call at any time, even when the connection
    // is not currently established (e.g. because of on-going network issues).
    async disconnect() {
        this.#connect_ = false;
        this.#connecting_ = false;
        this.#invalidSessionCounter_ = 0;
        this.#sessionId_ = null;
        this.#sessionSequence_ = null;

        return this.#socket_.disconnect();
    }

    // ---------------------------------------------------------------------------------------------
    // Section: Messages
    // ---------------------------------------------------------------------------------------------

    // Identifies with the Discord server. Will use the 2 IDENTIFY opcode by default, which uses the
    // token configured in the bot's configuration file. If a previous connection existed and the
    // connection was lost, a 6 RESUME message will be send instead.
    identify() {
        if (this.#sessionId_ !== null) {
            return this.sendOpcodeMessage({
                op: DiscordConnection.kOpcodeResume,
                token: this.#configuration_.token,
                session_id: this.#sessionId_,
                seq: this.#sessionSequence_,
            });
        }

        return this.sendOpcodeMessage({
            op: DiscordConnection.kOpcodeIdentify,
            d: {
                token: this.#configuration_.token,
                properties: {
                    '$os': 'linux',
                    '$browser': 'lvpjs-nuwani',
                    '$device': 'lvpjs-nuwani',
                },
                compress: false,
            }
        });
    }

    // Sends an opcode message back to the Discord server. Only the |op| argument is required, the
    // rest have sensible default values, although you usually want to use them.
    async sendOpcodeMessage({ op, d = {}, s = null, t = null } = {}) {
        if (!this.#connected_)
            return false;

        return await this.#socket_.write({ op, d, s, t });
    }

    // ---------------------------------------------------------------------------------------------
    // Section: Socket delegate
    // ---------------------------------------------------------------------------------------------

    // Called when the connection with Discord has been closed for any reason. A reconnection
    // attempt can be started by |this| class in response, if one is still desired. Certain parts of
    // the state will be re-set to stop on-going behaviour in this class.
    onConnectionClosed() {
        this.#connected_ = false;

        this.#authenticated_ = false;
        this.#heartbeatMonitorToken_ = null;

        if (this.#invalidSessionCounter_ >= kMaximumInvalidSessions) {
            if (!server.isTest())
                console.log(`[Discord] Exceeded the maximum number of invalid sessions; aborting`);

            this.disconnect();
        } else if (this.#connect_) {
            this.connect();
        }
    }

    // Called when the connection with Discord has been established. All connection state will be
    // reset, as the full handshake process will start over again from scratch.
    onConnectionEstablished() {
        this.#connected_ = true;
        this.#connecting_ = false;

        this.#authenticated_ = false;
        this.#heartbeatIntervalMs_ = null;
        this.#heartbeatAckTime_ = null;
    }

    // Called when the a connection attempt with Discord has failed. The DiscordSocket will continue
    // to try to establish a connection, following an exponential back-off.
    onConnectionFailed() {}

    // Called when a message has been received from Discord. This is a JavaScript object that
    // follows the Gateway Payload Structure from the Discord API.
    onMessage(message) {
        switch (message.op) {
            case DiscordConnection.kOpcodeDispatch:
                this.#sessionSequence_ = message.s;
                this.onDispatchMessage(message.t, message.d);
                break;

            case DiscordConnection.kOpcodeHeartbeat:
                this.sendOpcodeMessage({ op: DiscordConnection.kOpcodeHeartbeatAck });
                break;

            case DiscordConnection.kOpcodeHeartbeatAck:
                this.#heartbeatAckTime_ = server.clock.monotonicallyIncreasingTime();
                break;

            case DiscordConnection.kOpcodeHello:
                if (!message.d.hasOwnProperty('heartbeat_interval'))
                    console.log(`[Discord] Heartbeat interval missing in 10 HELLO:`, message);

                this.#heartbeatIntervalMs_ = message.d.heartbeat_interval ?? 41250;
                this.heartbeatMonitor();

                this.identify();
                break;

            case DiscordConnection.kOpcodeInvalidSession:
                this.#invalidSessionCounter_++;
                this.#sessionId_ = false;

                this.#socket_.disconnect();
                break;

            case DiscordConnection.kOpcodeReconnect:
                this.#socket_.disconnect();
                break;

            default:
                console.log(`[Discord] Unhandled message:`, message);
                break;
        }
    }

    // Called when a dispatch message of the given |type| has been received, with the given |data|.
    // Some |type|s will be handled internally, most are forwarded to our delegate.
    onDispatchMessage(type, data) {
        switch (type) {
            case 'READY':
                if (data.hasOwnProperty('session_id'))
                    this.#sessionId_ = data.session_id;

                this.#authenticated_ = true;
                this.#invalidSessionCounter_ = 0;
                break;
        }

        this.#delegate_.onMessage(type, data);
    }

    // ---------------------------------------------------------------------------------------------
    // Section: Heartbeat monitor
    // ---------------------------------------------------------------------------------------------

    // Runs the heartbeat monitor while the connection is established. The interval is defined by
    // the Discord server. The monitor runs until the connection has disconnected.
    async heartbeatMonitor() {
        const heartbeatMonitorToken = Symbol('Heartbeat monitor');

        // Store the |token|, so that we always know whether we're still the active monitor.
        this.#heartbeatMonitorToken_ = heartbeatMonitorToken;

        // Sanity check: require the heartbeat to be at least ten seconds, to avoid having accidents
        // where we needlessly spam the Discord server, and risk getting banned.
        if (!this.#heartbeatIntervalMs_ || this.#heartbeatIntervalMs_ < kMinimumHeartbeatMonitorMs)
            throw new Error(`Unwilling to start the Discord monitor: interval too low.`);

        while (true) {
            await wait(this.#heartbeatIntervalMs_);
            await Promise.resolve();

            if (this.#heartbeatMonitorToken_ !== heartbeatMonitorToken)
                return;  // the heartbeat monitor was stopped

            this.sendOpcodeMessage({ op: DiscordConnection.kOpcodeHeartbeat });
        }
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.#heartbeatMonitorToken_ = null;

        this.#socket_.disconnect();

        this.#socket_.dispose();
        this.#socket_ = null;
    }
}
