// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Bot } from 'features/nuwani/runtime/bot.js';

// Observer for the |Runtime| class. Objects that wish to observe connection state for the bots
// must extend the following class, which gives it default behaviour.
export class RuntimeObserver {
    onBotConnected(bot) {}
    onBotMessage(bot, message) {}
    onBotDisconnected(bot) {}
}

// Provides the core runtime of the IRC system: maintains the individual Bot instances and routes
// incoming messages and commands to the appropriate place.
export class Runtime {
    configuration_ = null;

    bots_ = [];
    observers_ = null;

    constructor(configuration) {
        this.configuration_ = configuration;
        this.observers_ = new Set();

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

    // Called by the message distributor when messages are being dropped because the command rate is
    // too high. An extra slave would be able to help out. Adding a slave is at our discretion.
    requestSlaveIncrease() {
        // TODO: Implement this method.
        console.log('------> Requesting an additional slave.');
    }

    // Called by the message distributor when the bot command rate is sufficiently low to be able to
    // get by with a slave less. The runtime can decide whether to honour this request.
    requestSlaveDecrease() {
        // TODO: Implement this method.
        console.log('------> Requesting a slave to be turned down.');
    }

    // Disconnect all the bots from the network.
    diconnect() {
        for (const bot of this.bots_)
            bot.disconnect();
    }

    // Adds the given |observer| to the list of observers for bot connectivity. Must extend the
    // RuntimeObserver interface.
    addObserver(observer) {
        if (!(observer instanceof RuntimeObserver))
            throw new Error('The given |observer| does not extend RuntimeObserver.');

        this.observers_.add(observer);
    }

    removeObserver(observer) {
        this.observers_.delete(observer);
    }

    // ---------------------------------------------------------------------------------------------
    // BotDelegate implementation:

    // Called when the |bot| has connected, finished registration and is ready for use.
    onBotConnected(bot) {
        if (!this.observers_)
            throw new Error('Invalid call to onBotConnected: instance has been disposed of.');

        for (const observer of this.observers_)
            observer.onBotConnected(bot);
    }

    // Called when the |bot| has received a message. All response is optional.
    onBotMessage(bot, message) {
        if (!this.observers_)
            throw new Error('Invalid call to onBotMessage: instance has been disposed of.');

        for (const observer of this.observers_)
            observer.onBotMessage(bot, message);
    }

    // Called when the |bot| has disconnected from the network.
    onBotDisconnected(bot) {
        if (!this.observers_)
            throw new Error('Invalid call to onBotDisconnected: instance has been disposed of.');

        for (const observer of this.observers_)
            observer.onBotDisconnected(bot);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.observers_.clear();
        this.observers_ = null;

        for (const bot of this.bots_)
            bot.dispose();

        this.bots_ = [];
    }
}
