// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandManager } from 'features/nuwani/commands/command_manager.js';
import { Configuration } from 'features/nuwani/configuration.js';
import Feature from 'components/feature_manager/feature.js';
import { MessageDistributor } from 'features/nuwani/echo/message_distributor.js';
import { Runtime } from 'features/nuwani/runtime/runtime.js';
import { TestBot } from 'features/nuwani/test/test_bot.js';

// Mocked implementation of the Nuwani feature. Implements the public API and allows tests to
// inspect messages that were to be sent, as well as fake incoming messages for commands.
export class MockNuwani extends Feature {
    configuration_ = null;
    runtime_ = null;
    commandManager_ = null;
    messageDistributor_ = null;

    messages_ = null;

    // Gets the messages that have been echoed to IRC so far.
    get messagesForTesting() { return this.messages_; }

    // Gets the CommandManager with which IRC commands can be created.
    get commandManager() { return this.commandManager_; }

    // Gets the configuration that set-up how the bots will behave.
    get configuration() { return this.configuration_; }

    // Gets the message distributor that's responsible for fanning out messages.
    get messageDistributor() { return this.messageDistributor_; }

    // Gets the message formatter responsible for making messages on IRC look pretty.
    get messageFormatter() { return { reloadFormat: () => 1 }; }

    // Gets the runtime that powers the connection to IRC.
    get runtime() { return this.runtime_; }

    constructor() {
        super();

        // Nuwani is considered to be a foundational feature.
        this.markFoundational();

        this.configuration_ = new Configuration();

        this.runtime_ = new Runtime(this.configuration_, /* BotConstructor= */ TestBot);

        this.commandManager_ = new CommandManager(this.runtime_, this.configuration_);

        this.messageDistributor_ = new MessageDistributor(this.runtime_, this.configuration_);
        // TODO: Can we run the message distributor?

        this.messages_ = [];

        // Connect to the network as the final step for the mock, because this is a synchronous
        // operation in tests, whereas it's (highly) asynchronous in normal situations.
        this.runtime_.connect();
    }

    // ---------------------------------------------------------------------------------------------

    // Distributes a |tag| message to IRC, which will be formatted with the |params|. Should only be
    // used by JavaScript code. Formatting is strict, and issues will throw exceptions.
    echo(tag, ...params) {
        this.messages_.push({ tag, params });
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.messageDistributor_.dispose();
        this.messageDistributor_ = null;

        this.commandManager_.dispose();
        this.commandManager_ = null;

        this.runtime_.dispose();
        this.runtime_ = null;
    }
}
