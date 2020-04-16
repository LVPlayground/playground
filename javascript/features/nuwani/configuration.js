// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { kTestConfiguration } from 'features/nuwani/test/test_configuration.js';

// Wraps the Nuwani configuration defined in "nuwani.json", validates it and allows JavaScript code
// to access it in a more ideomatic manner.
export class Configuration {
    bots_ = [];
    servers_ = [];
    channels_ = [];

    // Gets the bots that should be connected. Each bot is listed as { nickname, password, master },
    // and there is guaranteed to only be a single master.
    get bots() { return this.bots_; }

    // Gets the list of servers the bot could be connecting to. These are all expected to point to
    // the same network. The first server will be preferred, subsequent servers will only be
    // considered in case of a connection failure. Each server is listed as { ip, port, ssl }.
    get servers() { return this.servers_; }

    // Gets the channels that the bot should join. Each entry is listed as { channel, echo,
    // password }, where the password may be NULL if no password is required.
    get channels() { return this.channels_; }

    // Constructs the Configuration file. In production the data will be read from a file called
    // "nuwani.json", whereas tests will have to do with a verified testing configuration.
    constructor() {
        if (server.isTest())
            this.initializeFromJson(kTestConfiguration);
        else
            this.initializeFromFile('nuwani.json');
    }

    // Initializes the configuration from |filename|, which must exist in the SA-MP server's root
    // directory. This file can contain sensitive information and should not be widely shared.
    initializeFromFile(filename) {
        this.initializeFromJson(JSON.parse(readFile(filename)));
    }

    // Initializes the configuration based on the JSON |configuration|. All fields will be checked
    // for validity, with default values added where required.
    initializeFromJson(configuration) {
        if (typeof configuration !== 'object')
            throw new Error('The IRC configuration must be a JSON object.');
        
        this.bots_ = [];
        this.servers_ = [];
        this.channels_ = [];

        // (1) Load the bot's identity configuration.
        if (!configuration.hasOwnProperty('bots') || !Array.isArray(configuration.bots))
            throw new Error('The IRC bots must be indicated in a JSON array.');
        
        if (!configuration.bots.length)
            throw new Error('At least one IRC bot must be included in the configuration.');

        configuration.bots.forEach(bot => this.safeAddBot(bot));

        // (2) Load the servers to connect to.
        if (!configuration.hasOwnProperty('servers') || !Array.isArray(configuration.servers))
            throw new Error('The IRC servers must be indicated in a JSON array.');

        if (!configuration.servers.length)
            throw new Error('At least one IRC server must be included in the configuration.');

        configuration.servers.forEach(server => this.safeAddServer(server));

        // (3) Load the channels to join.
        if (!configuration.hasOwnProperty('channels') || !Array.isArray(configuration.channels))
            throw new Error('The IRC channels must be indicated in a JSON array.');
        
        if (!configuration.channels.length)
            throw new Error('At least one IRC channel must be included in the configuration.');

        configuration.channels.forEach(channel => this.safeAddChannel(channel));

        // (4) Require that the master bot has been defined.
        if (this.bots_.filter(bot => bot.master).length !== 1)
            throw new Error('Exactly one IRC bot must be specified as the master bot.');

        // (5) Require that the echo channel has been defined.
        if (this.channels_.filter(channel => channel.echo).length !== 1)
            throw new Error('Exactly one IRC channel must be specified as the echo channel.');
    }

    // Adds the given |bot| to the list of bots to spawn. The nickname is required and must be valid
    // for most IRC networks. A NickServ password may be given. Only a single master is allowed.
    safeAddBot(bot) {
        if (!bot.hasOwnProperty('nickname') || typeof bot.nickname !== 'string')
            throw new Error('A bot must have a textual nickname assigned to it.');

        if (!/^[a-z_\-\[\]\\^{}|`][a-z0-9_\-\[\]\\^{}|`]{2,15}$/i.test(bot.nickname))
            throw new Error('Invalid IRC nickname given: ' + bot.nickname);
        
        if (bot.hasOwnProperty('password') && typeof bot.password !== 'string')
            throw new Error('Invalid IRC Bot password given: ' + bot.password);
        
        if (bot.hasOwnProperty('master') && typeof bot.master !== 'boolean')
            throw new Error('Invalid IRC Bot master flag given: ' + bot.master);

        this.bots_.push(Object.assign({
            password: null,
            master: false,
        }, bot));
    }

    // Adds the given |server| to the list of servers the bot could be connecting to. The server's
    // IP address is required, port (defaults to 6667) and ssl (defaults to FALSE) are optional.
    safeAddServer(server) {
        if (!server.hasOwnProperty('ip') || typeof server.ip !== 'string')
            throw new Error('IRC servers must include their IP address.');

        if (!/^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/.test(server.ip))
            throw new Error('Invalid IRC server IP address: ' + server.ip);
        
        if (server.hasOwnProperty('port') && !Number.isSafeInteger(server.port))
            throw new Error('Invalid IRC server port: ' + server.port);
        
        if (server.hasOwnProperty('ssl') && typeof server.ssl !== 'boolean')
            throw new Error('Invalid IRC server SSL: ' + server.ssl);
        
        this.servers_.push(Object.assign({
            port: 6667,
            ssl: false,
        }, server));
    }

    // Adds the given |channel| to the list of channels the bot should join upon connection. The
    // channel must be given, although the password is optional and defaults to NULL.
    safeAddChannel(channel) {
        if (!channel.hasOwnProperty('channel') || typeof channel.channel !== 'string')
            throw new Error('IRC channel must include the channel name.');
        
        if (channel.hasOwnProperty('password') && typeof channel.password !== 'string')
            throw new Error('Invalid IRC channel password: ' + channel.password);
        
        if (channel.hasOwnProperty('echo') && typeof channel.echo !== 'boolean')
            throw new Error('Invalid IRC channel echo: ' + channel.echo);

        this.channels_.push(Object.assign({
            password: null,
            echo: false,
        }, channel));
    }
}
