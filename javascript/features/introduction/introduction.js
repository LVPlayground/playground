// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let Feature = require('components/feature_manager/feature.js');

// File in which the JSON data for the /help command is stored.
const DATA_FILE_HELP = 'data/help_command.json';

// The Introduction feature provides commands and functionality to help new players get familiar
// with Las Venturas Playground. Among this is the /help command.
class Introduction extends Feature {
  constructor(playground) {
    super(playground);

    // TODO(Russell): Load /help information from a data file.

    // TODO(Russell): Include /commands in this.
    // TODO(Russell): Include /irc in this.

    playground.commandManager.registerCommand('help', Introduction.prototype.onHelpCommand.bind(this))
                             .registerCommand('rules', Introduction.prototype.onRulesCommand.bind(this));
  }

  // Called when a player executes the /help command in-game. A dialog will be displayed that allows
  // them to access lots of introductory information about our community.
  //
  // @command /help
  onHelpCommand(player, parameters) {
    // TODO(Russell): Display the actual /help contents to the player.
  }

  // Called when a player executes the /rules command in-game. A dialog will be shown with all the
  // rules that they will have to keep in mind while enjoying some time on the server.
  //
  // @command /rules
  onRulesCommand(player, parameters) {
    // TODO(Russell): Display the actual /rules contents to the player.
  }
};

exports = Introduction;
