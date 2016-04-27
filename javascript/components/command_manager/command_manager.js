// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const CommandBuilder = require('components/command_manager/command_builder.js');
const ScopedCallbacks = require('base/scoped_callbacks.js');

// The command manager maintains a registry of available in-game commands and provides the ability
// to parse and dispatch commands to their associated handlers.
class CommandManager {
  constructor() {
    this.commands_ = {};

    // Attach the global event listeners which we need to reliably handle commands.
    this.callbacks_ = new ScopedCallbacks();
    this.callbacks_.addEventListener(
        'playercommandtext', CommandManager.prototype.onPlayerCommandText.bind(this));
  }

  // Registers |command| as a new command, which will invoke |listener| when used.
  //
  // Read the online documentation for more information on the |parameters| syntax:
  //   https://github.com/LVPlayground/playground/tree/master/javascript/components/command_manager
  registerCommand(command, listener) {
    if (this.commands_.hasOwnProperty(command))
      throw new Error('The command /' + command + ' has already been registered.');

    this.commands_[command] = listener;
  }

  // Creates a command builder for the command named |command|. The |build()| method must be called
  // on the returned builder in order for the command to become registered.
  //
  // Read the online documentation for more information on command builders:
  //   https://github.com/LVPlayground/playground/tree/master/javascript/components/command_manager
  buildCommand(command) {
    if (this.commands_.hasOwnProperty(command))
      throw new Error('The command /' + command + ' has already been registered.');

    return new CommandBuilder(CommandBuilder.COMMAND, this, command);
  }

  // Called when a player executes an in-game command. Will prevent the event from being executed in
  // the Pawn portion of the gamemode when the command can be handled here.
  onPlayerCommandText(event) {
    let player = server.playerManager.getById(event.playerid);
    if (!player)
      return;

    let commandText = event.cmdtext,
        commandNameEnd = commandText.indexOf(' ');

    if (commandNameEnd == -1)
      commandNameEnd = commandText.length;

    let commandName = commandText.substr(1, commandNameEnd - 1).toLowerCase(),
        commandArguments = commandText.substr(commandNameEnd + 1).trim();

    // If the command is not known to the command manager, it's likely to be implemented in the Pawn
    // part of Las Venturas Playground. Just ignore the command for now.
    if (!this.commands_.hasOwnProperty(commandName))
      return;

    // We can handle the event, so no need for Pawn to handle the event as well.
    event.preventDefault();

    this.commands_[commandName](player, commandArguments);
  }

  // Disposes of the callbacks created as part of this class.
  dispose() {
    this.callbacks_.dispose();
  }
};

exports = CommandManager;
