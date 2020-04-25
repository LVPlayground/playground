// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Configuration } from 'features/nuwani/configuration.js';
import Feature from 'components/feature_manager/feature.js';
import { Runtime } from 'features/nuwani/runtime/runtime.js';
import { TestBot } from 'features/nuwani/test/test_bot.js';

// Mocked implementation of the Nuwani feature. Implements the public API and allows tests to
// inspect messages that were to be sent, as well as fake incoming messages for commands.
export class MockNuwani extends Feature {
    configuration_ = null;
    runtime_ = null;

    messages_ = null;

    // Gets the messages that have been echoed to IRC so far.
    get messagesForTesting() { return this.messages_; }

    // Gets the CommandManager with which IRC commands can be created.
    get commandManager() { throw new Error('Not yet implemented in MockNuwani'); }

    // Gets the runtime that powers the connection to IRC.
    get runtime() { return this.runtime_; }

    constructor() {
        super();

        this.configuration_ = new Configuration();
        this.runtime_ = new Runtime(this.configuration_, /* BotConstructor= */ TestBot);

        this.messages_ = [];
    }

    // ---------------------------------------------------------------------------------------------

    // Distributes a |tag| message to IRC, which will be formatted with the |params|. Should only be
    // used by JavaScript code. Formatting is strict, and issues will throw exceptions.
    echo(tag, ...params) {
        this.messages_.push({ tag, params });
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {}
}
