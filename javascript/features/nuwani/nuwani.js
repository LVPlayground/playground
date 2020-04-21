// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Feature from 'components/feature_manager/feature.js';

import { CommandManager } from 'features/nuwani/commands/command_manager.js';
import { Configuration } from 'features/nuwani/configuration.js';
import { MessageDistributor } from 'features/nuwani/echo/runtime_distributor.js';
import { Runtime } from 'features/nuwani/runtime/runtime.js';

import { CommunicationCommands } from 'features/nuwani/commands/communication_commands.js';
import { MaintenanceCommands } from 'features/nuwani/commands/maintenance_commands.js';
import { PlayerCommands } from 'features/nuwani/commands/player_commands.js';

// Base of the Nuwani feature, which is a JavaScript-powered implementation of the IRC Bots that
// provide echo and communication functionalities to a series of IRC channels.
export default class extends Feature {
    configuration_ = null;
    runtime_ = null;

    messageDistributor_ = null;

    commandManager_ = null;
    commands_ = null;

    // Gets the CommandManager with which IRC commands can be created.
    get commandManager() { return this.commandManager_; }

    constructor() {
        super();

        if (server.isTest())
            return;

        this.configuration_ = new Configuration();

        // The Runtime is responsible for connectivity with the IRC Network, in accordance with the
        // configuration. We immediately initiate the connection.
        this.runtime_ = new Runtime(this.configuration_);
        this.runtime_.connect();

        // The message distributor is responsible for the fan-out of echo messages to individual
        // bots, and to make sure that we're able to cope with the message load.
        this.messageDistributor_ = new MessageDistributor(this.runtime_, this.configuration_);
        this.messageDistributor_.run();

        // The command manager deals with commands exposed to IRC. They work identical to those
        // available in-game, and thus must be created with a Builder, either by this Feature or
        // by other ones that depend on IRC connectivity.
        this.commandManager_ = new CommandManager(this.runtime_, this.configuration_);

        // Initiate a series of commands that are provided by the Nuwani feature directly. They can
        // be split up in multiple components for organisational reasons.
        this.commands_ = [
            new CommunicationCommands(this.commandManager_),
            new MaintenanceCommands(this.commandManager_, this.configuration_),
            new PlayerCommands(this.commandManager_),
        ];
    }

    dispose() {
        for (const instance of this.commands_)
            instance.dispose();

        this.commands_ = null;

        this.commandManager_.dispose();
        this.commandManager_ = null;

        this.messageDistributor_.dispose();
        this.messageDistributor_ = null;

        this.runtime_.dispose();
        this.runtime_ = null;
    }
}
