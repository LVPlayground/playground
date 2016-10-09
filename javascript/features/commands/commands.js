// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Feature = require('components/feature_manager/feature.js');
const InfoDialogCommand = require('features/commands/info_dialog_command.js');
const PositioningCommands = require('features/commands/positioning_commands.js');
const IrcChatCommands = require('features/commands/irc_chat_commands.js');

// Feature that provides a series of commands not immediately affiliated with a particular feature.
// The Commands class provides the shared infrastructure, whereas groups of commands will be
// implemented separately based on their own requirements.
class Commands extends Feature {
  constructor() {
    super();

    const commandManager = server.commandManager;

    // Informational commands whose data will be loaded from a JSON file.
    commandManager.registerCommand('help', InfoDialogCommand.create('data/commands/help.json'));
    commandManager.registerCommand('irc', InfoDialogCommand.create('data/commands/irc.json'));
    commandManager.registerCommand('rules', InfoDialogCommand.create('data/commands/rules.json'));

    // Load the seperated positioning-related commands
    this.positioningCommands_ = new PositioningCommands();

    // Needed to easily send a message to IRC
    const announce = this.defineDependency('announce');

    // Load the irc-chat commands to send a message to a channel
    this.ircChatCommands_ = new IrcChatCommands(announce);
  }

  dispose() {
    this.positioningCommands_.dispose();
    this.ircChatCommands_.dispose();
  }
};

exports = Commands;
