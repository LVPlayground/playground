// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Bot } from 'features/nuwani/runtime/bot.js';

// Provides the core runtime of the IRC system: maintains the individual Bot instances and routes
// incoming messages and commands to the appropriate place.
export class Runtime {
    configuration_ = null;
    bots_ = [];

    constructor(configuration) {
        this.configuration_ = configuration;

        const serverConfig = configuration.servers;
        const channelConfig = configuration.channels;

        for (const config of this.configuration_.bots)
            this.bots_.push(new Bot(this, config, serverConfig, channelConfig));
    }

    // Initialize each of the bots defined in the configuration. The bots will automatically begin
    // maintaining their connections with an exponential backoff policy.
    connect() {
        for (const bot of this.bots_)
            bot.connect();
    }

    // Disconnect all the bots from the network.
    diconnect() {
        for (const bot of this.bots_)
            bot.disconnect();
    }

    // ---------------------------------------------------------------------------------------------
    // BotDelegate implementation:

    // Called when the |bot| has connected, finished registration and is ready for use.
    onBotConnected(bot) {

    }

    // Called when the |bot| has received a message. All response is optional.
    onBotMessage(bot, message) {

    }

    // Called when the |bot| has disconnected from the network.
    onBotDisconnected(bot) {

    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        for (const bot of this.bots_)
            bot.dispose();

        this.bots_ = [];
    }
}
