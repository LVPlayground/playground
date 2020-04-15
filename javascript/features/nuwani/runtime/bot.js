// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Connection } from 'features/nuwani/runtime/connection.js';

// Represents an individual Bot that can be connected to IRC. Manages its own connection and will
// signal to the Runtime when its ready to start sending messages.
export class Bot {
    bot_ = null;
    channels_ = null;

    connection_ = null;

    constructor(bot, servers, channels) {
        this.bot_ = bot;
        this.channels_ = channels;

        this.connection_ = new Connection(servers, this);
        this.connection_.connect();
    }

    // ConnectionDelegate implementation:
    // ---------------------------------------------------------------------------------------------

    // Called when the TCP connection with the IRC server has been established. The first thing to
    // do here is the handshake to identify ourselves with the server.
    onConnectionEstablished() {
        console.log('[IRC] Connected!');

        this.connection_.write(`NICK ${this.bot_.nickname}`);
        this.connection_.write(`USER ${this.bot_.nickname} 0 * :Nuwani IRC Bot`);
    }

    // Called when the |message| has been received from the connection. It's an already decoded
    // string that contains at most a single to-be-parsed IRC command.
    onConnectionMessage(message) {
        console.log('[IRC] :[' + message + ']');

        const parts = message.split(' ');

        // Ping message from the server
        if (parts[0] === 'PING')
            this.connection_.write(`PONG ${parts[1]}`);

        if (parts[1] === 'PRIVMSG' && parts[3] === ':?time')
            this.connection_.write(`PRIVMSG ${parts[2]} :I have no idea!`);

        // End of MoTD: join channels
        if (parts[1] === '396') {
            for (const channel of this.channels_)
                this.connection_.write(`JOIN ${channel.channel} ${channel.password || ''}`);
        }
    }

    // Called when the TCP connection with the IRC server has been closed. The bot will no longer be
    // able to do anything until the connection has been re-established.
    onConnectionClosed() {
        console.log('[IRC] Disconnected');
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.connection_.dispose();
        this.connection_ = null;
    }
}
