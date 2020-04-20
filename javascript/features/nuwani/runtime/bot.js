// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Connection } from 'features/nuwani/runtime/connection.js';
import { ConnectionHandshake } from 'features/nuwani/runtime/connection_handshake.js';
import { Message } from 'features/nuwani/runtime/message.js';
import { NetworkTracker } from 'features/nuwani/runtime/network_tracker.js';

// Represents an individual Bot that can be connected to IRC. Manages its own connection and will
// signal to the Runtime when its ready to start sending messages.
export class Bot {
    // Possible states the Bot system can be in. Explicitly disconnected bots will not try to
    // establish a connection until they're told to connect.
    static kStateDisconnected = 0;
    static kStateConnecting = 2;
    static kStateConnected = 1;

    delegate_ = null;
    config_ = null;
    nickname_ = null;

    connection_ = null;
    handshake_ = null;
    networkTracker_ = null;
    state_ = null;

    // Gets the configuration that's been assigned to this bot.
    get config() { return this.config_; }

    // Gets the nickname that has been assigned to this bot. Normally this will be the nickname set
    // in configuration, but this can be changed during registration and through the NICK command.
    get nickname() { return this.nickname_; }

    constructor(delegate, config, servers, channels) {
        this.delegate_ = delegate;
        this.config_ = config;
        this.nickname_ = config.nickname;

        this.connection_ = new Connection(servers, this);
        this.handshake_ = new ConnectionHandshake(this, channels, this.connection_);
        this.networkTracker_ = new NetworkTracker(this);
        this.state_ = Bot.kStateDisconnected;
    }

    // Begins connecting this bot to the network. No-op if the bot isn't currently disconnected.
    connect() {
        if (this.state_ !== Bot.kStateDisconnected)
            return;

        this.connection_.connect();
        this.state_ = Bot.kStateConnecting;
    }

    // Writes the given |message| to the network. The bot must be connected to the network for this
    // to work, and will throw an exception otherwise.
    write(message) {
        if (this.state_ !== Bot.kStateConnected)
            throw new Error('Messages may only be written when the bot is connected.');
        
        this.connection_.write(message);
    }

    // Convenience API for determining whether the |target| identifies a channel or a user. This is
    // network agnostic, and also supports non-#-prefixed channels.
    isChannelName(target) {
        const types = this.networkTracker_.getSupportRule('CHANTYPES') || '#';
        return types.indexOf(target[0]) > -1;
    }

    // Returns the user modes set for the |nickname| on the echo channel, if any.
    getUserModesInEchoChannel(nickname) {
        let echoChannel = null;

        for (const channel of this.handshake_.channels) {
            if (!channel.echo)
                continue;
            
            echoChannel = channel.channel;
            break;
        }

        if (!echoChannel)
            throw new Error('Unable to identify the echo channel from the ConnectionHandshake.');

        const channel = this.networkTracker_.channels.get(echoChannel);
        if (!channel)
            return undefined;  // the bot hasn't joined the echo channel (yet)

        return channel.users.get(nickname);
    }

    // Disconnects the bot from the network and will not re-establish connection by itself. Will be
    // a no-op if the bot isn't currently connected or connecting to the network.
    disconnect() {
        switch (this.state_) {
            case Bot.kStateDisconnected:
                break;

            case Bot.kStateConnecting:
            case Bot.kStateConnected:
                this.connection_.disconnect();
                break;
        }

        this.state_ = Bot.kStateDisconnected;
    }

    // ConnectionDelegate implementation:
    // ---------------------------------------------------------------------------------------------

    // Called when the TCP connection with the IRC server has been established. The connection
    // handshake will begin immediately.
    onConnectionEstablished() {
        this.log('Connected to the server, beginning handshake...');

        this.state_ = Bot.kStateConnected;
        this.handshake_.start();
    }

    // Called when the |messageString| has been received from the connection. It's an already decoded
    // string that contains at most a single to-be-parsed IRC command.
    onConnectionMessage(messageString) {
        const message = new Message(messageString);

        this.log(messageString, '>> ');

        if (this.handshake_.handleMessage(message))
            return;
        
        this.networkTracker_.handleMessage(message);

        if (this.config_.master)
            this.delegate_.onBotMessage(this, message);
    }

    // Called when the TCP connection with the IRC server has been closed. The bot will no longer be
    // able to do anything until the connection has been re-established.
    onConnectionClosed() {
        this.log('Disconnected');

        this.delegate_.onBotDisconnected(this);

        this.handshake_.reset();
        this.networkTracker_.reset();

        // Reset the nickname, it might be available again on reconnection.
        this.nickname_ = this.config_.nickname;

        switch (this.state_) {
            case Bot.kStateDisconnected:
                break;  // do not reconnect
            
            case Bot.kStateConnecting:
            case Bot.kStateConnected:
                this.state_ = Bot.kStateConnecting;
                this.connection_.connect();
                break;
        }
    }

    // ConnectionHandshakeDelegate implementation:
    // ---------------------------------------------------------------------------------------------

    // Called when the connection handshake has completed. At this point the bot is ready for use.
    onHandshakeCompleted() {
        this.delegate_.onBotConnected(this);
    }

    // NetworkTrackerDelegate implementation:
    // ---------------------------------------------------------------------------------------------

    // Called when the nickname of the connected bot changes to |newNickname|. This could be
    // initiated by the system (e.g. to resolve conflicts on registration), an issued NICK command
    // or a change forced by the server and/or an IRC Operator.
    onNicknameChange(newNickname) {
        this.log(`Nickname changed from ${this.nickname_} to ${newNickname}`);

        this.nickname_ = newNickname;
    }

    // ---------------------------------------------------------------------------------------------

    log(message, prefix = '') {
        if (server.isTest())
            return;

        console.log(`[IRC Bot:${this.nickname}] ${prefix}${message}`);
    }

    dispose() {
        this.networkTracker_.dispose();
        this.networkTracker_ = null;

        this.handshake_.dispose();
        this.handshake_ = null;

        if (this.state_ === Bot.kStateConnected)
            this.connection_.write('QUIT :Shutting down...');

        this.connection_.dispose();
        this.connection_ = null;
    }
}
