// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Bot } from 'features/nuwani/runtime/bot.js';
import { Configuration } from 'features/nuwani/configuration.js';
import { TestServerSocket } from 'features/nuwani/test/test_server_socket.js';

describe('Bot', (it, beforeEach, afterEach) => {
    class DefaultBotDelegate {
        onBotConnected(bot) {}
        onBotMessage(bot, message) {}
        onBotDisconnected(bot) {}
    }

    let configuration = null;
    let network = null;

    beforeEach(() => {
        configuration = new Configuration();
        network = new TestServerSocket();
    });

    afterEach(() => network.dispose());

    it('disallows write() calls before the bot is connected to the network', assert => {
        const bot = new Bot(new DefaultBotDelegate, configuration.bots[0], configuration.servers,
                            configuration.channels);

        assert.throws(() => bot.write('PRIVMSG #echo :Hello, world!'));

        bot.onConnectionEstablished();
        assert.doesNotThrow(() => bot.write('PONG :server.name'));

        bot.disconnect();
        assert.throws(() => bot.write('PRIVMSG #private :Cannot see this.'));
    });

    it('is able to identify channel names based on RPL_ISUPPORT replies', assert => {
        const bot = new Bot(new DefaultBotDelegate, configuration.bots[0], configuration.servers,
                            configuration.channels);

        assert.isTrue(bot.isChannelName('#foo'));
        assert.isFalse(bot.isChannelName('&foo'));

        bot.onConnectionMessage(':server.name 005 A CHANTYPES=#&');

        assert.isTrue(bot.isChannelName('#foo'));
        assert.isTrue(bot.isChannelName('&foo'));

        bot.onConnectionMessage(':server.name 005 CHANTYPES=& B');

        assert.isFalse(bot.isChannelName('#foo'));
        assert.isTrue(bot.isChannelName('&foo'));
    });

    it('is able to get the channel modes for users in the echo channel', assert => {
        const bot = new Bot(new DefaultBotDelegate, configuration.bots[0], configuration.servers,
                            configuration.channels);
        
        assert.isUndefined(bot.getUserModesInEchoChannel('Joe'));

        bot.onConnectionMessage(`:${bot.nickname}!user@host JOIN :#LVP.DevJS`);

        assert.strictEqual(bot.getUserModesInEchoChannel(bot.nickname), '');
        assert.isUndefined(bot.getUserModesInEchoChannel('Joe'));

        bot.onConnectionMessage(':server.name 005 OVERRIDE PREFIX=(Yqaohv)!~&@%+ NAMESX');
        bot.onConnectionMessage(':server.name 353 NuwaniJS @ #LVP.DevJS :&Joe');

        assert.strictEqual(bot.getUserModesInEchoChannel('Joe'), 'a');
    });

    it('is able to keep up with nickname changes', assert => {
        const bot = new Bot(new DefaultBotDelegate, configuration.bots[0], configuration.servers,
                            configuration.channels);

        assert.equal(bot.nickname, configuration.bots[0].nickname);

        bot.onConnectionMessage(`:${bot.nickname}!user@host NICK :AmazingBot`);
        assert.equal(bot.nickname, 'AmazingBot');

        bot.onConnectionMessage(`:SomeoneElse!user@host NICK :NaughtyBot`);
        assert.equal(bot.nickname, 'AmazingBot');
    });

    it('should only forward messages received by the master bot', async(assert) => {
        let messageCount = 0;

        const expectMessageDelegate = new class extends DefaultBotDelegate {
            onBotMessage(bot, message) {
                ++messageCount;
            }
        };

        const rejectMessageDelegate = new class extends DefaultBotDelegate {
            onBotMessage(bot, message) {
                assert.notReached();
            }
        };

        const master = new Bot(expectMessageDelegate, configuration.bots[0], configuration.servers,
                               configuration.channels);

        const config = { };
        const slave = new Bot(rejectMessageDelegate, config, configuration.servers,
                              configuration.channels);
        
        assert.equal(messageCount, 0);

        master.onConnectionMessage(':Joe!joe@host PRIVMSG #private :Hey bot!');
        assert.equal(messageCount, 1);

        slave.onConnectionMessage(':Joe!joe@host PRIVMSG #private :Hey bot!');
        assert.equal(messageCount, 1);
    });
});
