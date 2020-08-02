// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { DiscordManager } from 'features/nuwani_discord/discord_manager.js';
import { DiscordRuntime } from 'features/nuwani_discord/discord_runtime.js';
import { Feature } from 'components/feature_manager/feature.js';

// Base feature for Nuwani's Discord extension. Builds closely on top of the Nuwani system, but is
// implemented as its own feature to enable more narrow encapsulation. Our intention with Discord
// integration is specified in the README.md file, which also describes the architecture.
export default class NuwaniDiscord extends Feature {
    manager_ = null;
    nuwani_ = null;
    runtime_ = null;

    constructor() {
        super();

        // Depend on Nuwani because, well, we're part of the Nuwani system.
        this.nuwani_ = this.defineDependency('nuwani');

        // The manager is the high-level interface through which we'll react to Discord messages
        // and state. It builds on top of the Runtime, which is the intelligence layer.
        this.manager_ = new DiscordManager();

        // The main Discord runtime, which owns the connection and decides what has to happen based
        // on which messages are being received by the server. Responsible for keeping state.
        this.runtime_ = new DiscordRuntime(this.nuwani_().configuration.discord, this.manager_);
        this.runtime_.connect();
    }

    dispose() {
        this.runtime_.dispose();
        this.runtime_ = null;

        this.manager_.dispose();
        this.manager_ = null;

        this.nuwani_ = null;
    }
}
