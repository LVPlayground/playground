// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandContext } from 'features/nuwani/commands/command_context.js';
import { Configuration } from 'features/nuwani/configuration.js';
import { Message } from 'features/nuwani/runtime/message.js';
import { TestBot } from 'features/nuwani/test/test_bot.js';

describe('CommandContext', it => {
    it('should be able identify and respond to channel-bound messages', assert => {
        const bot = new TestBot();

        const message = new Message(':Joe!user@host PRIVMSG #echo :?hello');
        const context = new CommandContext(bot, message);

        assert.equal(context.nickname, 'Joe');
        assert.equal(context.target, '#echo');
        
        context.respond('Thank you!');

        assert.equal(bot.messagesForTesting.length, 1);
        assert.equal(bot.messagesForTesting[0], 'PRIVMSG #echo :Thank you!');
    });

    it('should be able identify and respond to private messages', assert => {
        const bot = new TestBot();

        const message = new Message(':Joe!user@host PRIVMSG NuwaniJS :?hello');
        const context = new CommandContext(bot, message);

        assert.equal(context.nickname, 'Joe');
        assert.equal(context.target, 'Joe');

        context.respond('Thank you!');

        assert.equal(bot.messagesForTesting.length, 1);
        assert.equal(bot.messagesForTesting[0], 'PRIVMSG Joe :Thank you!');
    });

    it('should be able to write raw commands to the bot', assert => {
        const bot = new TestBot();

        const message = new Message(':Joe!user@host PRIVMSG NuwaniJS :?hello');
        const context = new CommandContext(bot, message);

        context.write('PONG :server.name');

        assert.equal(bot.messagesForTesting.length, 1);
        assert.equal(bot.messagesForTesting[0], 'PONG :server.name');
    });
});
