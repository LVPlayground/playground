// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/command_manager/command_builder.js';
import { CommandManager } from 'features/nuwani/commands/command_manager.js';
import { Configuration } from 'features/nuwani/configuration.js';
import { Message } from 'features/nuwani/runtime/message.js';
import { TestBot } from 'features/nuwani/test/test_bot.js';

describe('CommandManager', it => {
    it('should not be able to register duplicate commands', assert => {
        const manager = new CommandManager(/* runtime= */ null, new Configuration());

        assert.throws(() => manager.removeCommand('hello'));
        assert.doesNotThrow(() => manager.registerCommand('hello', function() {}));
        assert.throws(() => manager.registerCommand('hello', function() {}));
        assert.throws(() => manager.buildCommand('hello'));
        assert.doesNotThrow(() => manager.removeCommand('hello'));
        assert.doesNotThrow(() => manager.registerCommand('hello', function() {}));
    });

    it('should respect the command prefix, regardless of length', assert => {
        // Default command prefix
        {
            let called = false;

            const manager = new CommandManager(/* runtime= */ null, new Configuration());

            manager.buildCommand('test').build(() => called = true);
            manager.onBotMessage(new TestBot(), new Message(':Joe@host PRIVMSG #echo :!test'));

            assert.isTrue(called);
        }

        // Custom, multi-character command prefix
        {
            let called = false;

            const configuration = new Configuration();
            configuration.commandPrefix_ = '%%';

            const manager = new CommandManager(/* runtime= */ null, configuration);

            manager.buildCommand('test').build(() => called = true);
            manager.onBotMessage(new TestBot(), new Message(':Joe@host PRIVMSG #echo :%%test'));

            assert.isTrue(called);
        }
    });

    it('should be able to respond with usage messages in case of invalid syntax', assert => {
        const manager = new CommandManager(/* runtime= */ null, new Configuration());
        const bot = new TestBot();

        let calledWith = null;

        manager.buildCommand('test')
            .parameters([{ name: 'value', type: CommandBuilder.NUMBER_PARAMETER } ])
            .build((context, value) => calledWith = value);
        
        manager.onBotMessage(bot, new Message(':Joe@host PRIVMSG #echo :!test'));

        assert.isNull(calledWith);
        assert.equal(bot.messagesForTesting.length, 1);
        assert.equal(bot.messagesForTesting[0], 'PRIVMSG #echo :10Usage: !test [value]');

        manager.onBotMessage(bot, new Message(':Joe@host PRIVMSG #echo :!test lolcat'));

        assert.isNull(calledWith);
        assert.equal(bot.messagesForTesting.length, 2);
        assert.equal(bot.messagesForTesting[1], 'PRIVMSG #echo :10Usage: !test [value]');

        manager.onBotMessage(bot, new Message(':Joe@host PRIVMSG #echo :!test 42'));

        assert.strictEqual(calledWith, 42);
        assert.equal(bot.messagesForTesting.length, 2);
    });

    it('should be able to respond with an error in case of insufficient rights', assert => {
        const manager = new CommandManager(/* runtime= */ null, new Configuration());
        const bot = new TestBot();

        let called = false;

        manager.buildCommand('test')
            .restrict(Player.LEVEL_MANAGEMENT)
            .build((context) => called = true);

        manager.onBotMessage(bot, new Message(':Joe@host PRIVMSG #echo :!test'));

        assert.isFalse(called);
        assert.equal(bot.messagesForTesting.length, 1);
        assert.equal(
            bot.messagesForTesting[0],
            'PRIVMSG #echo :4Error: Sorry, this command is only available to Management members.');
        
        bot.setUserModesInEchoChannelForTesting('Joe', 'a');

        manager.onBotMessage(bot, new Message(':Joe@host PRIVMSG #echo :!test'));

        assert.isTrue(called);
        assert.equal(bot.messagesForTesting.length, 1);
    });

    it('should be able to identify in-game players, or error when unknown', assert => {
        const manager = new CommandManager(/* runtime= */ null, new Configuration());
        const bot = new TestBot();

        let calledForPlayerName = null;

        manager.buildCommand('test')
            .parameters([{ name: 'target', type: CommandBuilder.PLAYER_PARAMETER }])
            .build((context, target) => calledForPlayerName = target.name);
        
        manager.onBotMessage(bot, new Message(':Joe@host PRIVMSG #echo :!test Craig'));
        
        assert.isNull(calledForPlayerName);
        assert.equal(bot.messagesForTesting.length, 1);
        assert.equal(
            bot.messagesForTesting[0],
            'PRIVMSG #echo :4Error: Sorry, no player could be found for "Craig".');

        manager.onBotMessage(bot, new Message(':Joe@host PRIVMSG #echo :!test 0'));

        assert.equal(calledForPlayerName, server.playerManager.getById(0).name);
        assert.equal(bot.messagesForTesting.length, 1);
    });
});
