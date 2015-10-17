// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let Feature = require('components/feature_manager/feature.js'),
    Message = require('components/dialogs/message.js');

// Files in which the JSON data for the /irc and /rules command is stored. The contents must be an
// array with one or more strings as its contents, each of which will be a line in the dialog.
const DATA_FILE_IRC = 'data/irc_command.json';
const DATA_FILE_RULES = 'data/rules_command.json';

// File in which the JSON data for the /help command is stored.
const DATA_FILE_HELP = 'data/help_command.json';

// The Introduction feature provides commands and functionality to help new players get familiar
// with Las Venturas Playground. Among this is the /help command.
class Introduction extends Feature {
  constructor(playground) {
    super(playground);

    this.ircMessage_ = this.createMessageFromExternalData(DATA_FILE_IRC);
    this.rulesMessage_ = this.createMessageFromExternalData(DATA_FILE_RULES);

    // TODO(Russell): Load /help information from a data file.

    // TODO(Russell): Include /commands in this.

    playground.commandManager.registerCommand('help', Introduction.prototype.onHelpCommand.bind(this))
                             .registerCommand('irc', Introduction.prototype.onIrcCommand.bind(this))
                             .registerCommand('rules', Introduction.prototype.onRulesCommand.bind(this));
  }

  // Loads |filename| as a JSON array having one or more strings as its contents, and creates a new
  // Message that can be used to display the data to a player.
  createMessageFromExternalData(filename) {
    let messageLines = JSON.parse(readFile(filename));
    if (!Array.isArray(messageLines))
      throw new Error('The contents of ' + filename + ' are expected to be an array.');

    return new Message(messageLines.join('\n'));
  }

  // Called when a player executes the /help command in-game. A dialog will be displayed that allows
  // them to access lots of introductory information about our community.
  onHelpCommand(player, parameters) {
    // TODO(Russell): Display the actual /help contents to the player.
  }

  // Called when a player wants to know more about our IRC channel. A message will be shown with the
  // information they need to connect and join the conversation.
  onIrcCommand(player, parameters) {
    this.ircMessage_.displayForPlayer(player);
  }

  // Called when a player executes the /rules command in-game. A dialog will be shown with all the
  // rules that they will have to keep in mind while enjoying some time on the server.
  onRulesCommand(player, parameters) {
    this.rulesMessage_.displayForPlayer(player);
  }
};

exports = Introduction;
