// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Maximum time to wait for identifying to NickServ during the initial handshake.
const kPasswordRequestTimeoutMs = 4000;

// Text to search for in messages received from "NickServ" to determine whether the identification
// flow would start. Additional verification will be done before sending our password.
const kNickServTrigger = '/msg NickServ IDENTIFY';

// Generates a random four digit numeric suffix to append to the bot's nickname.
const GenerateNicknameSuffix = () => Math.floor(Math.random() * 8999) + 1000;

// The connection handshake manages registration with the server, identification with NickServ if a
// password is required, and joining the channels when all of that has completed.
export class ConnectionHandshake {
    // States the handshake process can be in.
    static kStateIdle = 0;
    static kStateRegistrationSent = 1;
    static kStateRegistrationAcknowledged = 2;
    static kStateAwaitingPasswordRequest = 3;
    static kStateDisposed = 999;

    bot_ = null;
    channels_ = null;
    connection_ = null;

    nickname_ = null;
    state_ = null;

    constructor(bot, channels, connection) {
        this.bot_ = bot;
        this.channels_ = channels;
        this.connection_ = connection;

        this.state_ = ConnectionHandshake.kStateIdle;
    }

    // Gets the current handshake state. Should only be used for testing.
    get stateForTesting() { return this.state_; }

    // Returns whether the handshake is currently active.
    isActive() { return this.state_ !== ConnectionHandshake.kStateIdle; }

    // Starts the connection handshake by sending the NICK and USER commands.
    start() {
        if (this.state_ !== ConnectionHandshake.kStateIdle)
            throw new Error('A connection handshake is already in progress');

        this.connection_.write(`NICK ${this.bot_.nickname}`);
        this.connection_.write(`USER ${this.bot_.nickname} 0 * :NuwaniJS IRC Bot`);

        this.nickname_ = this.bot_.nickname;
        this.state_ = ConnectionHandshake.kStateRegistrationSent;
    }

    // Called when a message has been received from the IRC server while the handshake is happening.
    handleMessage(message) {
        switch (message.command) {
            case '433':  // ERR_NICKNAMEINUSE
            case '436':  // ERR_NICKCOLLISION
                if (this.state_ === ConnectionHandshake.kStateRegistrationSent) {
                    this.nickname_ = this.bot_.nickname + GenerateNicknameSuffix();
                    this.connection_.write(`NICK ${this.nickname_}`);
                }

                return true;

            case '001':  // RPL_WELCOME
                this.state_ = ConnectionHandshake.kStateRegistrationAcknowledged;

                // TODO: Should we handle the case where the server doesn't have a MOTD, and thus
                // will never send the 376 (RPL_ENDOFMOTD) command?
                return false;

            case '004':  // RPL_MYINFO
                if (this.state_ === ConnectionHandshake.kStateRegistrationAcknowledged) {
                    // If the server supports the +B(ot) user mode, mark ourselves as one to be a
                    // good citizen. Channel can set restrictions for bots.
                    if (message.params.length >= 4 && message.params[3].includes('B'))
                        this.connection_.write(`MODE ${this.nickname_} +B`);
                }
    
                // Deliberately returning true: other code can consume RPL_MYINFO as well.
                return false;

            case '376':  // RPL_ENDOFMOTD
                if (this.bot_.password !== null) {
                    this.state_ = ConnectionHandshake.kStateAwaitingPasswordRequest;
                    this.runPasswordTimeoutHandler();
                } else {
                    this.joinChannelsAndCompleteHandshake();
                }

                return true;
            
            case 'NOTICE':
                if (message.source.nickname !== 'NickServ')
                    return false;  // message not from NickServ
                
                if (!message.params[1].includes(kNickServTrigger))
                    return false;  // message is not asking for identification
                
                if (!this.bot_.password) {
                    console.log('[IRC] NickServ is requesting a password, but none is configured.');
                    return false;
                }
                
                // TODO: Verify that NickServ is a network service prior to sending our password to
                // the name, otherwise this would be fairly easily exploitable.
                this.connection_.write(`PRIVMSG NickServ :IDENTIFY ${this.bot_.password}`);
                return true;
        }

        return false;
    }

    // In case NickServ is not available or just generally slow, we wait for a maximum amount of
    // time before considering the password request as having timed out. When that happens, move on
    // to joining the configured channels.
    async runPasswordTimeoutHandler() {
        await wait(kPasswordRequestTimeoutMs);

        if (this.state_ == ConnectionHandshake.kStateAwaitingPasswordRequest)
            this.joinChannelsAndCompleteHandshake();
    }

    // Requests to join the configured channels and considers the handshake as having completed.
    joinChannelsAndCompleteHandshake() {
        for (const channel of this.channels_) {
            if (channel.password)
                this.connection_.write(`JOIN ${channel.channel} ${channel.password}`);
            else
                this.connection_.write(`JOIN ${channel.channel}`);
        }

        this.state_ = ConnectionHandshake.kStateIdle;
    }

    // Resets the state of the handshake machine to idle, usually done when the connection has been
    // lost. A new handshake will be initiated upon reconnection.
    reset() {
        this.state_ = ConnectionHandshake.kStateIdle;
    }

    dispose() {
        this.bot_ = null;
        this.channels_ = null;
        this.connection_ = null;
        this.state_ = ConnectionHandshake.kStateDisposed;
    }
}
