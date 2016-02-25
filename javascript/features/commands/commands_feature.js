// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Feature = require('components/feature_manager/feature.js');

const InfoDialogCommand = require('features/commands/info_dialog_command.js');

// Feature that provides a series of commands not immediately affiliated with a particular feature.
// The CommandsFeature class provides the shared infrastructure, whereas groups of commands will
// be implemented separately based on their own requirements.
class CommandsFeature extends Feature {
  constructor(playground) {
    super(playground);

    const commandManager = playground.commandManager;

    // Informational commands whose data will be loaded from a JSON file.
    commandManager.registerCommand('help', InfoDialogCommand.create('data/commands/help.json'));
    commandManager.registerCommand('irc', InfoDialogCommand.create('data/commands/irc.json'));
    commandManager.registerCommand('rules', InfoDialogCommand.create('data/commands/rules.json'));
  }
};

exports = CommandsFeature;
