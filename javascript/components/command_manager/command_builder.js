// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let Command = require('components/command_manager/command.js');

// The command builder provides a convenient interface to build commands on, together with all the
// options that are possible to have for commands. A variety of checks will be done to ensure that
// the command will work consistently and reliably.
class CommandBuilder {
  constructor(level, parent, command, defaultValue = null) {
    this.level_ = level;
    this.parent_ = parent;

    this.command_ = command;
    this.defaultValue_ = defaultValue;

    this.listener_ = null;
    this.subCommands_ = [];
  }

  // Creates a new sub-command for the current command builder. The |subCommand| must be unique and,
  // when |defaultValue| is used, unambiguous from any of the other registered commands.
  sub(subCommand, defaultValue = null) {
    // TODO: Check for ambiguity with the currently known commands.

    return new CommandBuilder(CommandBuilder.SUB_COMMAND, this, subCommand, defaultValue);
  }

  // Internal API for adding |subCommand| to the list of known sub-commands.
  addSub(subCommand, listener) {

  }

  // Builds the command constructed by this builder, invoking |listener| when it got executed. Top-
  // level commands will be registered with the command manager, whereas sub-commands will be
  // registered with their parent command.
  build(listener) {
    this.listener_ = listener || null;

    // TODO: Should probably split out separate methods for (sub)command building.
    if (this.level_ == CommandBuilder.SUB_COMMAND) {
      // TODO: Flatten all known information for the current CommandBuilder instance.
      // TODO: Create a dynamic listener that does the routing for us.
      // TODO: Consider default values for the |this.command_| if it's an option parameter.
      this.parent_.addSub(this.command_, this.listener_);
      return this.parent_;
    }

    let command = new Command(this.command_, this.listener_);

    // TODO: Apply all settings for this command to |command|.
    // TODO: Expand this.subCommands_ 

    this.parent_.registerCommand(this.command_, (player, args) => command.invoke(player, args));
    return null;
  }
};

// Used for top-level commands of the command builder.
CommandBuilder.COMMAND = 0;

// Used for sub-commands created using the command builder.
CommandBuilder.SUB_COMMAND = 1;

exports = CommandBuilder;
