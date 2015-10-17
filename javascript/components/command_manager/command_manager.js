// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let Player = require('entities/player.js');

// The command manager maintains a registry of available in-game commands and provides the ability
// to parse and dispatch commands to their associated handlers.
class CommandManager {
  constructor() {
    this.commands_ = {};

    // Attach the global event listeners which we need to reliably handle commands.
    // TODO(Russell): We need a weak event binding model for events like these.
    global.addEventListener('playercommandtext', CommandManager.prototype.onPlayerCommandText.bind(this));
  }

  // Registers |command| as a new command that will result in |listener| being invoked when executed
  // by an in-game player. The instance of the command manager will be returned again to enable
  // builder-like call chaining when registering commands.
  registerCommand(command, listener) {
    // TODO(Russell): Support command parameter parsing.
    // TODO(Russell): Disallow registering the same command multiple times.

    this.commands_[command] = listener;
    return this;
  }

  // Called when a player executes an in-game command. Will prevent the event from being executed in
  // the Pawn portion of the gamemode when the command can be handled here.
  onPlayerCommandText(event) {
    let commandText = event.cmdtext,
        commandNameEnd = commandText.indexOf(' ');

    if (commandNameEnd == -1)
      commandNameEnd = commandText.length;

    let commandName = commandText.substr(1, commandNameEnd - 1),
        commandParams = commandText.substr(commandNameEnd + 1).trim();

    // If the command is not known to the command manager, it's likely to be implemented in the Pawn
    // part of Las Venturas Playground. Just ignore the command for now.
    if (!this.commands_.hasOwnProperty(commandName))
      return;

    // We can handle the event, so no need for Pawn to handle the event as well.
    event.preventDefault();

    // TODO(Russell): Actually start using the player pool.
    let player = new Player(event.playerid);

    // TODO(Russell): Parse the |commandParams| based on the |command|.
    let parameters = null;

    this.commands_[commandName](player, parameters);


  }

};

exports = CommandManager;
