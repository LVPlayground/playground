// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { NetworkTracker } from 'features/nuwani/runtime/network_tracker.js';
import { Message } from 'features/nuwani/runtime/message.js';

describe('NetworkTracker', (it, beforeEach) => {
    let bot;

    beforeEach(() => bot = {
        nickname: 'NuwaniJS',
        onNicknameChange: newNickname => bot.nickname = newNickname,
    });

    it('should be able to extract network configuration from RPL_ISUPPORT', assert => {
        const tracker = new NetworkTracker(bot);

        tracker.handleMessage(new Message(':server.com 005 A=a B C=ddd :are supported'));
        tracker.handleMessage(new Message(':server.com 005 NAMESX SAFELIST :are supported'));

        assert.equal(tracker.getSupportRule('A'), 'a');
        assert.isTrue(tracker.getSupportRule('B'));
        assert.equal(tracker.getSupportRule('C'), 'ddd');
        assert.isTrue(tracker.getSupportRule('NAMESX'));

        assert.isUndefined(tracker.getSupportRule('are'));
        assert.isUndefined(tracker.getSupportRule(':are'));
        assert.isUndefined(tracker.getSupportRule('supported'));
    });

    it('should be able to keep track of nickname changes', assert => {
        const tracker = new NetworkTracker(bot);

        assert.equal(bot.nickname, 'NuwaniJS');

        tracker.handleMessage(new Message(':NuwaniJS!user@host NICK :ShineyBot'));
        assert.equal(bot.nickname, 'ShineyBot');

        tracker.handleMessage(new Message(':ShineyBot!user@host NICK :PlaygroundBot'));
        assert.equal(bot.nickname, 'PlaygroundBot');

        tracker.handleMessage(new Message(':ShineyBot!user@host NICK :SomeoneElse'));
        assert.equal(bot.nickname, 'PlaygroundBot');
    });

    it('should be able to keep track of which channels the bot is in', assert => {
        const tracker = new NetworkTracker(bot);

        assert.equal(bot.nickname, 'NuwaniJS');
        assert.equal(tracker.channels.size, 0);

        tracker.handleMessage(new Message(':NuwaniJS!user@host JOIN :#echo'));

        assert.equal(tracker.channels.size, 1);
        assert.isTrue(tracker.channels.has('#echo'));

        // Case: The bot leaves the channel through a PART command
        {
            tracker.handleMessage(new Message(':NuwaniJS!user@host PART :#echo'));

            assert.equal(tracker.channels.size, 0);
            assert.isFalse(tracker.channels.has('#echo'));
        }

        tracker.handleMessage(new Message(':NuwaniJS!user@host JOIN :#echo'));

        assert.equal(tracker.channels.size, 1);
        assert.isTrue(tracker.channels.has('#echo'));

        // Case: The bot leaves the channel through a KICK command
        {
            tracker.handleMessage(new Message(':Joe!joe@host KICK #echo NuwaniJS :reason'));

            assert.equal(tracker.channels.size, 0);
            assert.isFalse(tracker.channels.has('#echo'));
        }
    });

    it('should keep track of the topics (and authors) of joined channels', assert => {
        const tracker = new NetworkTracker(bot);

        assert.equal(bot.nickname, 'NuwaniJS');
        assert.equal(tracker.channels.size, 0);

        tracker.handleMessage(new Message(':NuwaniJS!user@host JOIN :#echo'));

        assert.equal(tracker.channels.size, 1);

        const channel = tracker.channels.get('#echo');

        assert.isNotNull(channel);
        
        assert.isNull(channel.topic);
        assert.isNull(channel.topicSource);
        assert.isNull(channel.topicTime);

        tracker.handleMessage(new Message(':server.name 332 NuwaniJS #echo :Hello World!'));
        tracker.handleMessage(new Message(':server.name 333 NuwaniJS #echo Joe!joe@host :1476359387'));

        assert.equal(channel.topic, 'Hello World!');
        assert.equal(channel.topicSource.nickname, 'Joe');
        assert.equal(channel.topicSource.username, 'joe');
        assert.equal(channel.topicSource.hostname, 'host');
        assert.equal(channel.topicTime.toUTCString(), 'Thu, 13 Oct 2016 11:49:47 GMT');
    });

    it('should keep track of which users are on a channel', assert => {
        const tracker = new NetworkTracker(bot);

        assert.equal(bot.nickname, 'NuwaniJS');
        assert.equal(tracker.channels.size, 0);

        tracker.handleMessage(new Message(':NuwaniJS!user@host JOIN :#echo'));
        tracker.handleMessage(new Message(':NuwaniJS!user@host JOIN :#private'));

        assert.equal(tracker.channels.size, 2);

        const channel = tracker.channels.get('#echo');

        assert.isNotNull(channel);
        assert.equal(channel.users.size, 1);
        assert.isTrue(channel.users.has('NuwaniJS'));
        assert.isFalse(channel.users.has('Joe'));

        tracker.handleMessage(new Message(':Joe!joe@host JOIN :#echo'));
        tracker.handleMessage(new Message(':Ted!ted@host JOIN :#echo'));
        tracker.handleMessage(new Message(':Santa!claus@host JOIN :#private'));

        assert.equal(channel.users.size, 3);
        assert.isTrue(channel.users.has('Joe'));
        assert.isTrue(channel.users.has('Ted'));
        assert.isFalse(channel.users.has('Santa'));

        tracker.handleMessage(new Message(':Ted!ted@host PART :#echo'));
        
        assert.equal(channel.users.size, 2);
        assert.isFalse(channel.users.has('Ted'));

        tracker.handleMessage(new Message(':NuwaniJS!user@host KICK #echo Joe :bye!'));
        
        assert.equal(channel.users.size, 1);
        assert.isFalse(channel.users.has('Joe'));
        assert.isTrue(channel.users.has('NuwaniJS'));
    });

    it('should kick-start channel knowledge based on RPL_NAMREPLY', assert => {
        const tracker = new NetworkTracker(bot);

        assert.equal(bot.nickname, 'NuwaniJS');
        assert.equal(tracker.channels.size, 0);

        tracker.handleMessage(new Message(':NuwaniJS!user@host JOIN :#echo'));
        tracker.handleMessage(new Message(':NuwaniJS!user@host JOIN :#private'));

        assert.equal(tracker.channels.size, 2);

        const channel = tracker.channels.get('#echo');

        assert.equal(channel.users.size, 1);
        assert.isTrue(channel.users.has('NuwaniJS'));
        assert.equal(channel.users.get('NuwaniJS'), '');

        tracker.handleMessage(new Message(':server:name 353 NuwaniJS = #echo :Joe'));

        assert.equal(channel.users.size, 2);
        assert.isTrue(channel.users.has('Joe'));
        assert.equal(channel.users.get('Joe'), '');

        tracker.handleMessage(new Message(':server.com 005 OVERRIDE PREFIX=(Yqaohv)!~&@%+ NAMESX'));
        tracker.handleMessage(new Message(':server.com 353 NuwaniJS = #echo :&Ted @Fred Santa'));

        assert.equal(channel.users.size, 5);
        assert.equal(channel.users.get('Ted'), 'a');
        assert.equal(channel.users.get('Fred'), 'o');
        assert.equal(channel.users.get('Santa'), '');
    });
});
