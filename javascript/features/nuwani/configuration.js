// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { MessageSource } from 'features/nuwani/runtime/message_source.js';

import { kTestConfiguration } from 'features/nuwani/test/test_configuration.js';

// Wraps the Nuwani configuration defined in "nuwani.json", validates it and allows JavaScript code
// to access it in a more ideomatic manner.
export class Configuration {
    bots_ = [];
    servers_ = [];
    channels_ = [];
    discord_ = null;
    echoChannel_ = null;
    levels_ = [];
    commandPrefix_ = null;
    owners_ = [];
    passwordSalt_ = null;

    // Gets the bots that should be connected. Each bot is listed as { nickname, password, master,
    // optional }, and there is guaranteed to only be a single master.
    get bots() { return this.bots_; }

    // Gets the list of servers the bot could be connecting to. These are all expected to point to
    // the same network. The first server will be preferred, subsequent servers will only be
    // considered in case of a connection failure. Each server is listed as { ip, port, ssl }.
    get servers() { return this.servers_; }

    // Gets the channels that the bot should join. Each entry is listed as { channel, echo,
    // password }, where the password may be NULL if no password is required.
    get channels() { return this.channels_; }

    // Gets the echo channel to which output should be written. This is frequently accessed data,
    // so it makes sense to cache the value in a central place.
    get echoChannel() { return this.echoChannel_; }

    // Gets the level mapping between IRC channel mode in the echo channel, and how this should be
    // perceived in the command processor. Each entry is listed as { mode, level }, and the entries
    // are sorted in descending order based on the access level.
    get levels() { return this.levels_; }

    // Gets the prefix used to identify bot commands. Can be any number of characters long.
    get commandPrefix() { return this.commandPrefix_; }

    // Gets the Discord configuration, if Nuwani should be enabled to establish a connection with
    // Discord as well as IRC. Our interaction is different, and not a fully fledged echo server,
    // but it's a fair integration to get players excited after all. Structured as follows:
    // { clientId, clientSecret, endpoint, token }. Will be NULL when not specified.
    get discord() { return this.discord_; }

    // Gets the owners of the IRC bot. Each of those is an instance of MessageSource, where each of
    // the individual fields might be set to an asterisk to indicate "any value".
    get owners() { return this.owners_; }

    // Gets the password salt with which player passwords are generated. This field is optional
    // in the configuration, but required for Nuwani's ability to change player passwords.
    get passwordSalt() { return this.passwordSalt_; }

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
        this.levels_ = [];
        this.owners_ = [];
        this.passwordSalt_ = null;

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

        // (4) Load the level mappings.
        if (!configuration.hasOwnProperty('levels') || !Array.isArray(configuration.levels))
            throw new Error('The level mapping must be indicated in a JSON array.');

        configuration.levels.forEach(mapping => this.safeAddLevelMapping(mapping));

        // (5) Load the command prefix.
        if (!configuration.hasOwnProperty('commandPrefix') ||
                typeof configuration.commandPrefix !== 'string' ||
                !configuration.commandPrefix.length) {
            throw new Error('The command prefix must be indicated in a non-empty string.');
        }

        this.commandPrefix_ = configuration.commandPrefix;

        // (6) Load Discord configuration for the bot.
        if (configuration.hasOwnProperty('discord')) {
            if (typeof configuration.discord !== 'object')
                throw new Error(`Discord configuration must be given as a JSON object.`);

            if (typeof configuration.discord.clientId !== 'string')
                throw new Error(`The Discord Client ID must be given as a strong`);

            if (typeof configuration.discord.clientSecret !== 'string')
                throw new Error(`The Discord Client Secret must be given as a strong`);

            if (typeof configuration.discord.endpoint !== 'string')
                throw new Error(`The Discord endpoint must be given as a strong`);

            if (typeof configuration.discord.token !== 'string')
                throw new Error(`The Discord token must be given as a strong`);

            this.discord_ = {
                clientId: configuration.discord.clientId,
                clientSecret: configuration.discord.clientSecret,
                endpoint: configuration.discord.endpoint,
                token: configuration.discord.token,
            };
        }

        // (7) Load the list of owners of the bot.
        if (!configuration.hasOwnProperty('owners') || !Array.isArray(configuration.owners))
            throw new Error('The owners must be indicated in a JSON array.');

        configuration.owners.forEach(owner => this.safeAddOwner(owner));

        // (8) Load the password salt, if this field exists in the configuration.
        if (configuration.hasOwnProperty('passwordSalt') && !!configuration.passwordSalt) {
            if (typeof configuration.passwordSalt != 'string' || !configuration.passwordSalt.length)
                throw new Error('The password salt must be a non-zero string.');
            
            this.passwordSalt_ = configuration.passwordSalt;
        }

        // (9) Require that the master bot has been defined.
        if (this.bots_.filter(bot => bot.master).length !== 1)
            throw new Error('Exactly one IRC bot must be specified as the master bot.');

        // (10) Require that the echo channel has been defined.
        {
            const channels = this.channels_.filter(channel => channel.echo);
            if (channels.length !== 1)
                throw new Error('Exactly one IRC channel must be specified as the echo channel.');

            this.echoChannel_ = channels[0].channel;
        }  

        // (11) Sort the level mapping in descending order based on the access level.
        this.levels_.sort((lhs, rhs) => {
            if (lhs.level === rhs.level)
                return 0;
            
            return lhs.level > rhs.level ? -1 : 1;
        });
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

        if (bot.hasOwnProperty('optional') && typeof bot.optional !== 'boolean')
            throw new Error('Invalid IRC Bot optional flag given: ' + bot.optional);

        this.bots_.push(Object.assign({
            password: null,
            master: false,
            optional: false,
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

    // Adds the given |mapping| to the level mappings. Each mapping must be unique, and both sides
    // (the IRC user mode, and the LVP Level name) must be validated.
    safeAddLevelMapping(mapping) {
        if (!mapping.hasOwnProperty('mode') || typeof mapping.mode !== 'string')
            throw new Error('Level mapping must have a defined user mode.');
        
        if (!mapping.hasOwnProperty('level') || typeof mapping.level !== 'string')
            throw new Error('Level mapping must have a defined access level.');
        
        if (mapping.mode.length != 1)
            throw new Error('Level mapping user modes must be a single character.');
        
        const kMapping = {
            management: Player.LEVEL_MANAGEMENT,
            administrator: Player.LEVEL_ADMINISTRATOR,
        };

        if (!kMapping.hasOwnProperty(mapping.level))
            throw new Error('Level mapping access levels must be a valid string.');
        
        for (const existingMapping of this.levels_) {
            if (existingMapping.mode === mapping.mode)
                throw new Error('Level mapping has already been defined for: +' + mapping.mode);
        } 

        this.levels_.push({ mode: mapping.mode, level: kMapping[mapping.level] });
    }

    // Adds the given |owner| to the list of the bot's owners.
    safeAddOwner(owner) {
        if (typeof owner !== 'string' || !owner.length)
            throw new Error('Each bot owner must be a non-empty string.');
        
        const source = new MessageSource(owner);

        if (!source.nickname)
            throw new Error('Each bot owner must have a nickname set. Use * as a wildcard.');
        if (!source.username)
            throw new Error('Each bot owner must have a username set. Use * as a wildcard.');
        if (!source.hostname)
            throw new Error('Each bot owner must have a hostname set. Use * as a wildcard.');
        
        this.owners_.push(source);
    }
}
