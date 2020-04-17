// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Configuration } from 'features/nuwani/configuration.js';

// A configuration that will be accepted by the Configuration class.
function createConfiguration({ bots, servers, channels, levels } = {}) {
    return {
        bots: bots || [
            { nickname: 'Bot', password: 'foobar', master: true },
            { nickname: 'Slave' },
        ],
        servers: servers || [
            { ip: '127.0.0.1' },
            { ip: '127.0.0.2', port: 6668 },
            { ip: '127.0.0.3', port: 6697, ssl: true },
        ],
        channels: channels || [
            { channel: '#public', echo: true },
            { channel: '#private', password: 'joinme' },
        ],
        levels: levels || [
            { mode: 'Y', level: 'management' },
            { mode: 'q', level: 'management' },
            { mode: 'a', level: 'management' },
            { mode: 'o', level: 'administrator' },
            { mode: 'h', level: 'vip' },
            { mode: 'v', level: 'vip' },
        ],
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

        assert.equal(configuration.levels.size, 6);
        
        for (const mapping of createConfiguration().levels) {
            assert.isTrue(configuration.levels.has(mapping.mode));
            assert.equal(configuration.levels.get(mapping.mode), mapping.level);
        }
    });
});
