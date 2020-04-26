// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Configuration } from 'features/nuwani/configuration.js';
import { MessageSource } from 'features/nuwani/runtime/message_source.js';

// A configuration that will be accepted by the Configuration class.
function createConfiguration({ bots, servers, channels, levels, commandPrefix,
                               owners, passwordSalt } = {}) {
    return {
        bots: bots ?? [
            { nickname: 'Bot', password: 'foobar', master: true },
            { nickname: 'Slave', optional: true },
        ],
        servers: servers ?? [
            { ip: '127.0.0.1' },
            { ip: '127.0.0.2', port: 6668 },
            { ip: '127.0.0.3', port: 6697, ssl: true },
        ],
        channels: channels ?? [
            { channel: '#public', echo: true },
            { channel: '#private', password: 'joinme' },
        ],
        levels: levels ?? [
            { mode: 'Y', level: 'management' },
            { mode: 'q', level: 'management' },
            { mode: 'a', level: 'management' },
            { mode: 'o', level: 'administrator' },
            { mode: 'h', level: 'administrator' },
        ],
        commandPrefix: commandPrefix ?? '!',
        owners: owners ?? [
            'Joe!joe@*',
            '*!*@lvp.administrator',
        ],
        passwordSalt: passwordSalt ?? undefined,
    };
};

describe('Configuration', it => {
    it('verifies that the configured bots are valid', assert => {
        assert.throws(() => (new Configuration).initializeFromJson(createConfiguration({
            bots: []  // missing bots
        })));

        assert.throws(() => (new Configuration).initializeFromJson(createConfiguration({
            bots: [{ nickname: 'x' }]  // invalid nickname
        })));

        assert.throws(() => (new Configuration).initializeFromJson(createConfiguration({
            bots: [{ nickname: 'Bot' }]  // missing master
        })));

        assert.throws(() => (new Configuration).initializeFromJson(createConfiguration({
            bots: [
                { nickname: 'Bot', master: true },  // multiple masters
                { nickname: 'Bat', master: true },
            ],
        })));
    });

    it('verifies that the configured servers are valid', assert => {
        assert.throws(() => (new Configuration).initializeFromJson(createConfiguration({
            servers: []  // missing servers
        })));

        assert.throws(() => (new Configuration).initializeFromJson(createConfiguration({
            servers: [
                { ip: 'irc.sa-mp.nl' }, // not an IP address
            ],
        })));

        assert.throws(() => (new Configuration).initializeFromJson(createConfiguration({
            servers: [
                { ip: '127.0.0.1', port: 'yesplz' },  // invalid port
            ],
        })));

        assert.throws(() => (new Configuration).initializeFromJson(createConfiguration({
            servers: [
                { ip: '127.0.0.1', ssl: 'yesplz' },  // invalid ssl
            ],
        })));
    });

    it('verifies that the configured channels are valid', assert => {
        assert.throws(() => (new Configuration).initializeFromJson(createConfiguration({
            channels: [
                { notChannelName: '#foo' },  // missing channel name
                { channel: '#foo', echo: true },
            ],
        })));

        assert.throws(() => (new Configuration).initializeFromJson(createConfiguration({
            channels: [
                { channel: '#foo' },  // missing echo channel
            ],
        })));

        assert.throws(() => (new Configuration).initializeFromJson(createConfiguration({
            channels: [
                { channel: 123 },  // invalid channel type
                { channel: '#foo', echo: true },
            ],
        })));

        assert.throws(() => (new Configuration).initializeFromJson(createConfiguration({
            channels: [
                { channel: '#bar', password: 123 },  // invalid password type
                { channel: '#foo', echo: true },
            ],
        })));
    });

    it('correctly adds default values to omitted optional properties', assert => {
        const configuration = new Configuration();
        configuration.initializeFromJson(createConfiguration());

        assert.equal(configuration.bots.length, 2);
        assert.isNull(configuration.bots[1].password);
        assert.isFalse(configuration.bots[1].master);

        assert.equal(configuration.servers.length, 3);
        assert.equal(configuration.servers[0].port, 6667);
        assert.isFalse(configuration.servers[0].ssl);
        assert.isFalse(configuration.servers[1].ssl);

        assert.equal(configuration.channels.length, 2);
        assert.isNull(configuration.channels[0].password);

        assert.equal(configuration.echoChannel, configuration.channels[0].channel);
    });

    it('correctly reflects level associative information', assert => {
        assert.throws(() => (new Configuration).initializeFromJson(createConfiguration({
            levels: 'yesplz',  // invalid type
        })));

        assert.throws(() => (new Configuration).initializeFromJson(createConfiguration({
            levels: [
                { mode: 'qq', level: 'administrator' },  // invalid mode
            ]
        })));

        assert.throws(() => (new Configuration).initializeFromJson(createConfiguration({
            levels: [
                { mode: 'q', level: 'king' },  // invalid level
            ]
        })));

        assert.throws(() => (new Configuration).initializeFromJson(createConfiguration({
            levels: [
                { mode: 'q', level: 'management' },
                { mode: 'q', level: 'administrator' },  // defined twice
            ]
        })));

        const configuration = new Configuration();
        configuration.initializeFromJson(createConfiguration());

        assert.equal(configuration.levels.length, 5);

        let previousLevel = Player.LEVEL_MANAGEMENT;

        for (const mapping of configuration.levels) {
            assert.isBelowOrEqual(mapping.level, previousLevel);
            previousLevel = mapping.level;
        }
    });

    it('loads the configurable IRC command prefix', assert => {
        assert.throws(() => (new Configuration).initializeFromJson(createConfiguration({
            commandPrefix: 3.1415,  // not a string
        })));

        assert.throws(() => (new Configuration).initializeFromJson(createConfiguration({
            commandPrefix: '',  // empty string
        })));

        const configuration = new Configuration();
        configuration.initializeFromJson(createConfiguration());
        
        assert.equal(configuration.commandPrefix, '!');
    });

    it('loads a list of bot owner idents', assert => {
        assert.throws(() => (new Configuration).initializeFromJson(createConfiguration({
            owners: 'everyone!`',  // not an array
        })));

        assert.throws(() => (new Configuration).initializeFromJson(createConfiguration({
            owners: [
                3.1415,  // not a string
            ],
        })));

        assert.throws(() => (new Configuration).initializeFromJson(createConfiguration({
            owners: [
                'Joe',  // missing user/host
            ],
        })));

        assert.throws(() => (new Configuration).initializeFromJson(createConfiguration({
            owners: [
                'Joe@host',  // missing user
            ],
        })));

        assert.throws(() => (new Configuration).initializeFromJson(createConfiguration({
            owners: [
                'Joe!Joe!Joe%Joe^Joe',  // unparseable
            ],
        })));

        const configuration = new Configuration();
        configuration.initializeFromJson(createConfiguration());
        
        assert.equal(configuration.owners.length, 2);

        assert.isTrue(configuration.owners[0] instanceof MessageSource);
        assert.equal(configuration.owners[0].nickname, 'Joe');
        assert.equal(configuration.owners[0].username, 'joe');
        assert.equal(configuration.owners[0].hostname, '*');

        assert.isTrue(configuration.owners[1] instanceof MessageSource);
        assert.equal(configuration.owners[1].nickname, '*');
        assert.equal(configuration.owners[1].username, '*');
        assert.equal(configuration.owners[1].hostname, 'lvp.administrator');
    });

    it('loads the configured password salt, if any', assert => {
        {
            assert.throws(() => (new Configuration).initializeFromJson(createConfiguration({
                passwordSalt: 3.14,
            })));
        }
        {
            const configuration = new Configuration();
            configuration.initializeFromJson(createConfiguration());

            assert.isNull(configuration.passwordSalt);
        }
        {
            const configuration = new Configuration();
            configuration.initializeFromJson(createConfiguration({
                passwordSalt: 'hello-world',
            }));

            assert.equal(configuration.passwordSalt, 'hello-world');
        }
    });
});
