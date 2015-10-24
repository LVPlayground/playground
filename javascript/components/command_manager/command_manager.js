// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let Command = require('components/command_manager/command.js');

// The command manager maintains a registry of available in-game commands and provides the ability
// to parse and dispatch commands to their associated handlers.
class CommandManager {
  constructor(isTest) {
    this.commands_ = {};

    // Attach the global event listeners which we need to reliably handle commands.
    // TODO(Russell): We need a weak, safe event binding model for events like these.
    if (!isTest)
      global.addEventListener('playercommandtext', CommandManager.prototype.onPlayerCommandText.bind(this));
  }

  // Registers |command| as a new command. This method has two signatures:
  //
  //   CommandManager registerCommand(command, level, parameters, listener)
  //   CommandManager registerCommand(command, subCommands = [ { level, parameters, listener }, ... ]);
  //
  // The |command| must not exist yet in the system, and the name must not start with a slash (this
  // will be removed automatically by the dispatching routines).
  //
  // Read the online documentation for more information on the |parameters| syntax:
  //   https://github.com/LVPlayground/playground/tree/master/javascript/components/command_manager
  registerCommand(command, ...parameters) {
    if (this.commands_.hasOwnProperty(command))
      throw new Error('The command /' + command + ' has already been registered.');

    // Translate registerCommand(command, level, parameters, listener) to the multiple syntax.
    if (parameters.length == 3)
      parameters = [{ level: parameters[0], parameters: parameters[1], listener: parameters[2] }];

    // If there's a different number of parameters, we've been invoked in a weird way.
    else if (parameters.length != 1 || !Array.isArray(parameters[0]))
      throw new TypeError('Invalid parameters passed to CommandManager.registerCommand().');

    // TODO(Russell): Validate the |parameters| prior to creating a Command instance.

    this.commands_[command] = new Command(command, parameters);
    return this;
  }

  // Called when a player executes an in-game command. Will prevent the event from being executed in
  // the Pawn portion of the gamemode when the command can be handled here.
  onPlayerCommandText(event) {
    let player = Player.get(event.playerid);
    if (!player)
      return;

    let commandText = event.cmdtext,
        commandNameEnd = commandText.indexOf(' ');

    if (commandNameEnd == -1)
      commandNameEnd = commandText.length;

    let commandName = commandText.substr(1, commandNameEnd - 1),
        commandArguments = commandText.substr(commandNameEnd + 1).trim();

    // If the command is not known to the command manager, it's likely to be implemented in the Pawn
    // part of Las Venturas Playground. Just ignore the command for now.
    if (!this.commands_.hasOwnProperty(commandName))
      return;

    // We can handle the event, so no need for Pawn to handle the event as well.
    event.preventDefault();

    this.commands_[command].dispatch(player, commandArguments);
  }
};

exports = CommandManager;
