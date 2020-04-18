// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Message } from 'features/nuwani/runtime/message.js';

describe('Message', it => {
    it('should throw on invalid messages', assert => {
        assert.throws(() => new Message());
        assert.throws(() => new Message(''));
        assert.throws(() => new Message('^%$'));
        assert.throws(() => new Message(':nickname'));
    });

    it('should be able to parse messages that are just a command', assert => {
        const message = new Message('EXAMPLE');
        assert.isNull(message.source);
        assert.equal(message.command, 'EXAMPLE');
        assert.equal(message.params.length, 0);
    });

    it('should be able to parse messages that do not have a source', assert => {
        {
            const message = new Message('COMMAND :foo');
            assert.isNull(message.source);
            assert.equal(message.command, 'COMMAND');
            assert.equal(message.params.length, 1)
            assert.equal(message.params[0], 'foo');
        }
        {
            const message = new Message('COMMAND #foo bar');
            assert.isNull(message.source);
            assert.equal(message.command, 'COMMAND');
            assert.equal(message.params.length, 2);
            assert.equal(message.params[0], '#foo');
            assert.equal(message.params[1], 'bar');
        }
    });

    it('should be able to parse numeric commands', assert => {
        const message = new Message(':server.name 382 :Rehashing...');
        
        assert.isNotNull(message.source);
        assert.isTrue(message.source.isServer());
        assert.equal(message.source.hostname, 'server.name');

        assert.equal(message.command, '382');

        assert.equal(message.params.length, 1);
        assert.equal(message.params[0], 'Rehashing...');
    });

    it('should be able to parse textual commands', assert => {
        const message = new Message(':nick@host.com privmsg #channel :an irc message');

        assert.isNotNull(message.source);
        assert.isTrue(message.source.isUser());
        assert.equal(message.source.nickname, 'nick');
        assert.equal(message.source.hostname, 'host.com');

        assert.equal(message.command, 'PRIVMSG');

        assert.equal(message.params.length, 2);
        assert.equal(message.params[0], '#channel');
        assert.equal(message.params[1], 'an irc message');
    });

    it('should gracefully deal with excess spacing between parts', assert => {
        const message = new Message('  :Joe    418   I   :am a teapot  ');

        assert.isNotNull(message.source);
        assert.isTrue(message.source.isUser());
        assert.equal(message.source.nickname, 'Joe');

        assert.equal(message.command, '418');

        assert.equal(message.params.length, 2);
        assert.equal(message.params[0], 'I');
        assert.equal(message.params[1], 'am a teapot');
    });

    it('should be able to convert messages back to strings', assert => {
        assert.equal((new Message(':server 001 :Hello!')).toString(), ':server 001 :Hello!');
        assert.equal((new Message(':server 001 Hello!')).toString(), ':server 001 :Hello!');

        assert.equal((new Message('PING :server.name')).toString(), 'PING :server.name');

        assert.equal((new Message(':nick!user@host PRIVMSG NuwaniJS :Hello!')).toString(),
                    ':nick!user@host PRIVMSG NuwaniJS :Hello!');
        
        assert.equal((new Message(':nick@host notice NuwaniJS hi')).toString(),
                    ':nick@host NOTICE NuwaniJS :hi');
    });
});
