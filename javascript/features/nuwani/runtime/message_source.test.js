// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { MessageSource } from 'features/nuwani/runtime/message_source.js';

describe('MessageSource', it => {
    function verify(assert, string, { nickname = null, username = null, hostname = null,
                                      server = null, user = null } = {}) {
        let source = null;
        
        assert.doesNotThrow(() => source = new MessageSource(string));
        
        if (nickname !== null)
            assert.equal(source.nickname, nickname);
        if (username !== null)
            assert.equal(source.username, username);
        if (hostname !== null)
            assert.equal(source.hostname, hostname);
        if (server !== null) {
            if (server) assert.isTrue(source.isServer());
            else        assert.isFalse(source.isServer());
        }
        if (user !== null) {
            if (user) assert.isTrue(source.isUser());
            else      assert.isFalse(source.isUser());
        }
    }

    it('throws on invalid input', assert => {
        assert.throws(() => new MessageSource());
        assert.throws(() => new MessageSource(''));
        assert.throws(() => new MessageSource(3.1415));
    });

    it('is able to parse server sources', assert => {
        verify(assert, 'network.com', { hostname: 'network.com', server: true });
        verify(assert, 'irc.network.com', { hostname: 'irc.network.com', server: true });
    });

    it('is able to parse user sources', assert => {
        verify(assert, 'Joe', { nickname: 'Joe', user: true });
        verify(assert, 'Joe`', { nickname: 'Joe`', user: true });
        verify(assert, 'Joe-', { nickname: 'Joe-', user: true });

        verify(assert, 'Joe@computer', { nickname: 'Joe', hostname: 'computer', user: true });
        verify(assert, 'Joe@host.com', { nickname: 'Joe', hostname: 'host.com', user: true });
        verify(assert, 'Joe@127.0.0.1', { nickname: 'Joe', hostname: '127.0.0.1', user: true });

        verify(assert, 'Joe!user@hostname', { nickname: 'Joe', username: 'user',
                                              hostname: 'hostname', user: true });
    });
});
