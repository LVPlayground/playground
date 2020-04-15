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
        
        // Initialize each of the bots defined in the configuration. The bots will automatically
        // begin maintaining their connections with an exponential backoff policy.
        configuration.bots.forEach(bot =>
            this.bots_.push(new Bot(bot, configuration.servers, configuration.channels)));
    }

    dispose() {
        this.bots_.forEach(bot => bot.dispose());
        this.bots_ = [];
    }
}
