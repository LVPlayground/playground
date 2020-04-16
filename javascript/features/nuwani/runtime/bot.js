// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Connection } from 'features/nuwani/runtime/connection.js';
import { ConnectionHandshake } from 'features/nuwani/runtime/connection_handshake.js';
import { Message } from 'features/nuwani/runtime/message.js';

// Whitelist containing hostnames of folks who can use the ?eval command. Temporary.
const kEvalWhitelist = [
    'las.venturas.playground',
    'netstaff.irc.gtanet.com',
];

// Represents an individual Bot that can be connected to IRC. Manages its own connection and will
// signal to the Runtime when its ready to start sending messages.
export class Bot {
    connection_ = null;
    handshake_ = null;

    constructor(bot, servers, channels) {
        this.connection_ = new Connection(servers, this);
        this.connection_.connect();

        this.handshake_ = new ConnectionHandshake(bot, channels, this.connection_);
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
        this.connection_.connect();
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.handshake_.dispose();
        this.handshake_ = null;

        this.connection_.dispose();
        this.connection_ = null;
    }
}
