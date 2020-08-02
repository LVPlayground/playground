// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Feature } from 'components/feature_manager/feature.js';

import { CommandManager } from 'features/nuwani/commands/command_manager.js';
import { Configuration } from 'features/nuwani/configuration.js';
import { DiscordRuntime } from 'features/nuwani/discord/discord_runtime.js';
import { MaintenanceCommands } from 'features/nuwani/commands/maintenance_commands.js';
import { MessageDistributor } from 'features/nuwani/echo/message_distributor.js';
import { MessageFormatter } from 'features/nuwani/echo/message_formatter.js';
import { Runtime } from 'features/nuwani/runtime/runtime.js';

// Base of the Nuwani feature, which is a JavaScript-powered implementation of the IRC Bots that
// provide echo and communication functionalities to a series of IRC channels.
export default class Nuwani extends Feature {
    configuration_ = null;
    runtime_ = null;

    messageDistributor_ = null;

    commandManager_ = null;
    commands_ = null;
    discord_ = null;

    // Gets the CommandManager with which IRC commands can be created.
    get commandManager() { return this.commandManager_; }

    // Gets the configuration that has set-up how the bots will behave.
    get configuration() { return this.configuration_; }

    // Gets the Discord runtime, for sending select messages to Discord as well.
    get discord() { return this.discord_; }

    // Gets the message distributor that's responsible for fanning out messages.
    get messageDistributor() { return this.messageDistributor_; }

    // Gets the message formatter responsible for making messages on IRC look pretty.
    get messageFormatter() { return this.messageFormatter_; }

    // Gets the runtime that powers the connection to IRC.
    get runtime() { return this.runtime_; }

    constructor() {
        super();

        // This is a foundational feature.
        this.markFoundational();

        this.configuration_ = new Configuration();

        // The Runtime is responsible for connectivity with the IRC Network, in accordance with the
        // configuration. We immediately initiate the connection.
        this.runtime_ = new Runtime(this.configuration_);
        this.runtime_.connect();

        // Nuwani has limited support for interacting with Discord as well, through the Discord
        // WebSocket API. That's provided through this object.
        this.discord_ = new DiscordRuntime(this.configuration_.discord);
        this.discord_.connect();

        // The message distributor is responsible for the fan-out of echo messages to individual
        // bots, and to make sure that we're able to cope with the message load.
        this.messageDistributor_ = new MessageDistributor(this.runtime_, this.configuration_);
        this.messageDistributor_.run();

        // The message formatter is able to format messages according to the configured JSON file,
        // for display on IRC. It powers both JavaScript and Pawn-sourced messages.
        this.messageFormatter_ = new MessageFormatter(this.configuration_.echoChannel);

        // The command manager deals with commands exposed to IRC. They work identical to those
        // available in-game, and thus must be created with a Builder, either by this Feature or
        // by other ones that depend on IRC connectivity.
        this.commandManager_ = new CommandManager(this.runtime_, this.configuration_);

        // Provides the commands internal to Nuwani, for maintenance of the IRC system.
        this.commands_ = new MaintenanceCommands(this.commandManager_, this.configuration_, this);

        // Implement the EchoMessage native, which allows Pawn code to output text to the IRC echo.
        provideNative('EchoMessage', 'sss', Nuwani.prototype.echoFromPawn.bind(this));
    }

    // ---------------------------------------------------------------------------------------------

    // Distributes a |tag| message to IRC, which will be formatted with the |params|. Should only be
    // used by JavaScript code. Formatting is strict, and issues will throw exceptions.
    echo(tag, ...params) {
        const formattedMessage = this.messageFormatter_.format(tag, ...params);
        this.messageDistributor_.write(formattedMessage);
    }

    // Implements the EchoMessage native function, which has the following signature:
    //     native EchoMessage(tag[], format[], message[]);
    //
    // The native will be bound when this class is constructed, and will automatically be unbound on
    // disposal. Echoed messages will directly be distributed to IRC.
    echoFromPawn(tag, format, message) {
        const formattedMessage = this.messageFormatter_.formatPawn(tag, format, message);
        this.messageDistributor_.write(formattedMessage);

        return 1;
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        provideNative('EchoMessage', 'sss', (tag, format, message) => 1);

        this.commands_.dispose();
        this.commands_ = null;

        this.commandManager_.dispose();
        this.commandManager_ = null;

        this.messageFormatter_.dispose();
        this.messageFormatter_ = null;

        this.messageDistributor_.dispose();
        this.messageDistributor_ = null;

        this.discord_.dispose();
        this.discord_ = null;

        this.runtime_.dispose();
        this.runtime_ = null;
    }
}
