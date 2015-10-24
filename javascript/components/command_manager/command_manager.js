// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let Command = require('components/command_manager/command.js');

// The command manager maintains a registry of available in-game commands and provides the ability
// to parse and dispatch commands to their associated handlers.
class CommandManager {
  constructor() {
    this.commands_ = {};

    // Attach the global event listeners which we need to reliably handle commands.
    // TODO(Russell): We need a weak, safe event binding model for events like these.
    global.addEventListener('playercommandtext', CommandManager.prototype.onPlayerCommandText.bind(this));
  }

  // Removes this instance from listening to the playercommandtext event.
  // TODO(russell): This should be handled by some event binding model class as well.
  disposeForTests() {
    global.removeEventListener('playercommandtext', CommandManager.prototype.onPlayerCommandText.bind(this));
  }

  // Registers |commandName| as a new command that will result in |listener| being invoked when
  // executed by an in-game player. The instance of the command manager will be returned again to
  // enable builder-like call chaining when registering commands.
  //
  // Read the online documentation for more information on the |parameters| syntax:
  //   https://github.com/LVPlayground/playground/tree/master/javascript/components/command_manager
  registerCommand(commandName, parameters, listener) {
    if (this.commands_.hasOwnProperty(commandName))
      throw new Error('The command /' + commandName + ' has already been registered.');

    this.commands_[commandName] = new Command(commandName, parameters, listener);
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

    // Dispatch the event via the Command class, which will also display any applicable errors to
    // the player when there's a problem with the command they tried to execute.
    this.commands_[command].dispatch(player, commandArguments);

    // We can handle the event, so no need for Pawn to handle the event as well.
    event.preventDefault();
  }
};

exports = CommandManager;
