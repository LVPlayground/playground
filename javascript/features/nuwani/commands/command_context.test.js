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
        const context = CommandContext.createForMessage(bot, message, new Configuration());

        assert.equal(context.nickname, 'Joe');
        assert.equal(context.target, '#echo');
        
        context.respond('Thank you!');

        assert.equal(bot.messagesForTesting.length, 1);
        assert.equal(bot.messagesForTesting[0], 'PRIVMSG #echo :Thank you!');
    });

    it('should be able identify and respond to private messages', assert => {
        const bot = new TestBot();

        const message = new Message(':Joe!user@host PRIVMSG NuwaniJS :?hello');
        const context = CommandContext.createForMessage(bot, message, new Configuration());

        assert.equal(context.nickname, 'Joe');
        assert.equal(context.target, 'Joe');

        context.respond('Thank you!');

        assert.equal(bot.messagesForTesting.length, 1);
        assert.equal(bot.messagesForTesting[0], 'PRIVMSG Joe :Thank you!');
    });

    it('should be able to write raw commands to the bot', assert => {
        const bot = new TestBot();

        const message = new Message(':Joe!user@host PRIVMSG NuwaniJS :?hello');
        const context = CommandContext.createForMessage(bot, message, new Configuration());

        context.write('PONG :server.name');

        assert.equal(bot.messagesForTesting.length, 1);
        assert.equal(bot.messagesForTesting[0], 'PONG :server.name');
    });

    it('should be able to defer context from an incoming message', assert => {
        const bot = new TestBot();
        const configuration = new Configuration();

        const echoChannelMessage = new Message(':Joe!user@host PRIVMSG #LVP.DevJS :?hello world');
        const channelMessage = new Message(':Joe!user@host PRIVMSG #private :?hello world');
        const privateMessage = new Message(':Joe!user@host PRIVMSG NuwaniJS :?hello world');

        // Helper function for determining channel mode for a given level, to avoid having to
        // hardcode this in the test & them failing on unrelated JSON changes.
        function modeForLevel(level) {
            for (const mapping of configuration.levels) {
                if (mapping.level === level)
                    return mapping.mode;
            }

            throw new Error('Cannot find configured user mode for level: ' + level);
        }

        // (1) Message from a user without status.
        {
            const context = CommandContext.createForMessage(bot, channelMessage, configuration);
            assert.equal(context.level, Player.LEVEL_PLAYER);
            assert.isFalse(context.isVip());
        }

        // (2) Message from a user with +v (+)
        {
            bot.setUserModesInEchoChannelForTesting('Joe', 'v');

            const context = CommandContext.createForMessage(bot, channelMessage, configuration);
            assert.equal(context.level, Player.LEVEL_PLAYER);
            assert.isTrue(context.isVip());
        }

        // (3) Message from a user who is an administrator on IRC.
        {
            bot.setUserModesInEchoChannelForTesting(
                'Joe', modeForLevel(Player.LEVEL_ADMINISTRATOR));

            const context = CommandContext.createForMessage(bot, channelMessage, configuration);
            assert.equal(context.level, Player.LEVEL_ADMINISTRATOR);
            assert.isTrue(context.isVip());
        }

        // (4) Message from a user who is an administrator on IRC.
        {
            bot.setUserModesInEchoChannelForTesting(
                'Joe', modeForLevel(Player.LEVEL_MANAGEMENT));

            const context = CommandContext.createForMessage(bot, channelMessage, configuration);
            assert.equal(context.level, Player.LEVEL_MANAGEMENT);
            assert.isTrue(context.isVip());
        }

        // (5) Whether the channel was sent to the echo channel
        {
            const verifications = [
                { message: echoChannelMessage, result: true },
                { message: channelMessage, result: false },
                { message: privateMessage, result: false },
            ];

            for (const { message, result } of verifications) {
                const context = CommandContext.createForMessage(bot, message, configuration);
                assert.equal(context.inEchoChannel(), result);
            }
        }

        // (6) Whether the context can determine the bot owners.
        {
            const ownerMessage =
                new Message(':Ricky!owner@lvp.management PRIVMSG #LVP.DevJS :?hello world');
            
            const ownerContext = CommandContext.createForMessage(bot, ownerMessage, configuration);
            assert.isTrue(ownerContext.isOwner());

            const userContext = CommandContext.createForMessage(bot, channelMessage, configuration);
            assert.isFalse(userContext.isOwner());
        }
    });
});
