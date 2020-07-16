// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Feature } from 'components/feature_manager/feature.js';
import InfoDialogCommand from 'features/commands/info_dialog_command.js';
import IrcChatCommands from 'features/commands/irc_chat_commands.js';
import PositioningCommands from 'features/commands/positioning_commands.js';

// Feature that provides a series of commands not immediately affiliated with a particular feature.
// The Commands class provides the shared infrastructure, whereas groups of commands will be
// implemented separately based on their own requirements.
class Commands extends Feature {
    constructor() {
        super();

        const commandManager = server.commandManager;

        // Informational commands whose data will be loaded from a JSON file.
        
        commandManager.registerCommand('credits', InfoDialogCommand.create('data/commands/credits.json'));
        commandManager.registerCommand('guide', InfoDialogCommand.create('data/commands/guide.json'));
        commandManager.registerCommand('help', InfoDialogCommand.create('data/commands/help.json'));
        commandManager.registerCommand('irc', InfoDialogCommand.create('data/commands/irc.json'));
        commandManager.registerCommand('rules', InfoDialogCommand.create('data/commands/rules.json'));
        commandManager.registerCommand('vip', InfoDialogCommand.create('data/commands/vip.json'));

        // Load the seperated positioning-related commands
        this.positioningCommands_ = new PositioningCommands();

        // Needed to easily send a message to IRC
        const nuwani = this.defineDependency('nuwani');

        // Load the irc-chat commands to send a message to a channel
        this.ircChatCommands_ = new IrcChatCommands(nuwani);
    }

    dispose() {
        this.positioningCommands_.dispose();
        this.ircChatCommands_.dispose();

        server.commandManager.removeCommand('credits');
        server.commandManager.removeCommand('guide');
        server.commandManager.removeCommand('help');
        server.commandManager.removeCommand('irc');
        server.commandManager.removeCommand('rules');
        server.commandManager.removeCommand('vip');
    }
};

export default Commands;
