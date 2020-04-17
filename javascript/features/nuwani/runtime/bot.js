// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Connection } from 'features/nuwani/runtime/connection.js';
import { ConnectionHandshake } from 'features/nuwani/runtime/connection_handshake.js';
import { Message } from 'features/nuwani/runtime/message.js';
import { NetworkTracker } from 'features/nuwani/runtime/network_tracker.js';

// Whitelist containing hostnames of folks who can use the ?eval command. Temporary.
const kEvalWhitelist = [
    'las.venturas.playground',
    'netstaff.irc.gtanet.com',
];

// Represents an individual Bot that can be connected to IRC. Manages its own connection and will
// signal to the Runtime when its ready to start sending messages.
export class Bot {
    config_ = null;
    nickname_ = null;

    connection_ = null;
    handshake_ = null;
    network_tracker_ = null;

    // Gets the configuration that's been assigned to this bot.
    get config() { return this.config_; }

    // Gets the nickname that has been assigned to this bot. Normally this will be the nickname set
    // in configuration, but this can be changed during registration and through the NICK command.
    get nickname() { return this.nickname_; }

    constructor(config, servers, channels) {
        this.config_ = config;
        this.nickname_ = config.nickname;

        this.connection_ = new Connection(servers, this);
        this.connection_.connect();

        this.handshake_ = new ConnectionHandshake(this, channels, this.connection_);
        this.network_tracker_ = new NetworkTracker();
    }

    // ConnectionDelegate implementation:
    // ---------------------------------------------------------------------------------------------

    // Called when the TCP connection with the IRC server has been established. The connection
    // handshake will begin immediately.
    onConnectionEstablished() {
        console.log('[IRC] Connected to the server, beginning handshake...');
        this.handshake_.start();
    }

    // Called when the |messageString| has been received from the connection. It's an already decoded
    // string that contains at most a single to-be-parsed IRC command.
    onConnectionMessage(messageString) {
        const message = new Message(messageString);

        console.log('[IRC] :[' + messageString + ']');

        if (this.handshake_.handleMessage(message))
            return;
        
        this.network_tracker_.handleMessage(message);

        switch (message.command) {
            case 'PING':
                this.connection_.write(`PONG :${message.params[0]}`);
                break;
            
            case 'PRIVMSG':
                const destination = message.params[0];
                const parts = message.params[1].split(' ');

                switch (parts[0]) {
                    case '?eval':
                        if (kEvalWhitelist.includes(message.source.hostname))
                            this.connection_.write(`PRIVMSG ${destination} :`+ eval(parts.slice(1).join(' ')));

                        break;

                    case '?time':
                        this.connection_.write(`PRIVMSG ${destination} :${(new Date).toString()}`);
                        break;
                }

                break;
        }
    }

    // Called when the TCP connection with the IRC server has been closed. The bot will no longer be
    // able to do anything until the connection has been re-established.
    onConnectionClosed() {
        console.log('[IRC] Disconnected');

        this.handshake_.reset();
        this.network_tracker_.reset();

        // Reset the nickname, it might be available again on reconnection.
        this.bot_nickname_ = this.bot_config_.nickname();

        this.connection_.connect();
    }

    // NetworkTrackerDelegate implementation:
    // ---------------------------------------------------------------------------------------------

    // Called when the nickname of the connected bot changes to |newNickname|. This could be
    // initiated by the system (e.g. to resolve conflicts on registration), an issued NICK command
    // or a change forced by the server and/or an IRC Operator.
    onNicknameChange(newNickname) {
        console.log('[IRC] Nickname changed to ' + newNickname);
        this.nickname_ = newNickname;
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.network_tracker_.dispose();
        this.network_tracker_ = null;

        this.handshake_.dispose();
        this.handshake_ = null;

        this.connection_.dispose();
        this.connection_ = null;
    }
}
