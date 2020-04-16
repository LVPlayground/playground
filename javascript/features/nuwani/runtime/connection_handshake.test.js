// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { ConnectionHandshake } from 'features/nuwani/runtime/connection_handshake.js';
import { Message } from 'features/nuwani/runtime/message.js';

// Fake Connection instance, supporting only the operations that the ConnectionHandshake class
// needs. Allows for inspecting the sent messages.
class FakeConnection {
    messages_ = [];

    // Gets the messages that were requested to be sent over the connection.
    get messages() { return this.messages_; }

    // Connection implementation:
    write(message) {
        this.messages_.push(message);
    }
}

describe('ConnectionHandshake', (it, beforeEach, afterEach) => {
    const bot = { nickname: 'Nuwani', password: '123456' };
    const channels = [
        { channel: '#public' },
        { channel: '#private', password: 'qwerty' }
    ];

    let connection = null;

    beforeEach(() => {
        connection = new FakeConnection();
    });

    it('should send the NICK and USER commands when starting the handshake', assert => {
        const handshake = new ConnectionHandshake(bot, channels, connection);

        assert.isFalse(handshake.isActive());
        assert.equal(connection.messages.length, 0);

        handshake.start();

        assert.isTrue(handshake.isActive());
        assert.equal(connection.messages.length, 2);
        assert.equal(connection.messages[0], 'NICK Nuwani');
        assert.equal(connection.messages[1], 'USER Nuwani 0 * :NuwaniJS IRC Bot');
    });

    it('should pick another nickname when the chosen one is in use', assert => {
        const handshake = new ConnectionHandshake(bot, channels, connection);

        handshake.start();
        handshake.handleMessage(new Message(':server.network.com 433 :Nickname is already in use'));

        assert.equal(connection.messages.length, 3);
        assert.equal(connection.messages[0], 'NICK Nuwani');
        assert.equal(connection.messages[1], 'USER Nuwani 0 * :NuwaniJS IRC Bot');
        assert.isTrue(/NICK Nuwani[0-9]{4}/i.test(connection.messages[2]));
    });

    it('should identify itself as a bot if the server supports it', assert => {
        {
            const handshake = new ConnectionHandshake(bot, channels, connection);

            handshake.start();
            handshake.handleMessage(new Message(':server.network.com 001 :Welcome to the network'));
            handshake.handleMessage(new Message(':server.network.com 004 :_ _ B _'));

            assert.equal(connection.messages.length, 3);
            assert.equal(connection.messages[2], 'MODE Nuwani +B');
        }
        {
            const handshake = new ConnectionHandshake(bot, channels, connection);

            handshake.start();
            handshake.handleMessage(new Message(':server.network.com 001 :Welcome to the network'));
            handshake.handleMessage(new Message(':server.network.com 004 :_ _ _ _'));  // missing B

            assert.equal(connection.messages.length, 3 /* first test */ + 2 /* this test */);
        }
    });

    it('should wait for NickServ identification before joining channels', async (assert) => {
        const handshake = new ConnectionHandshake(bot, channels, connection);

        handshake.start();
        handshake.handleMessage(new Message(':server.network.com 001 :Welcome to the network'));
        handshake.handleMessage(new Message(':server.network.com 376 :End of MoTD'));

        assert.equal(connection.messages.length, 2);
        assert.equal(handshake.stateForTesting, ConnectionHandshake.kStateAwaitingPasswordRequest);

        await server.clock.advance(/* timeout= */ 4000);

        assert.equal(handshake.stateForTesting, ConnectionHandshake.kStateIdle);
        assert.equal(connection.messages.length, 4);

        assert.equal(connection.messages[2], 'JOIN #public');
        assert.equal(connection.messages[3], 'JOIN #private qwerty');

        assert.isFalse(handshake.isActive());
    });

    it('should automatically identify with NickServ when requested', assert => {
        const handshake = new ConnectionHandshake(bot, channels, connection);
        const kIdentificationRequest =
            ':NickServ!services@network.com NOTICE NuwaniJS :nick, type /msg NickServ ' +
            'IDENTIFY password.  Otherwise,';

        assert.equal(connection.messages.length, 0);
        assert.isFalse(handshake.isActive());

        handshake.handleMessage(new Message(kIdentificationRequest));

        assert.isFalse(handshake.isActive());
        assert.equal(connection.messages.length, 1);

        assert.equal(connection.messages[0], 'PRIVMSG NickServ :IDENTIFY 123456');
    });
});
