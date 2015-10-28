// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

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
    return new CommandBuilder(CommandBuilder.SUB_COMMAND, this, subCommand, defaultValue);
  }

  // Internal API for adding |subCommand| to the list of known sub-commands. The |listener| will be
  // invoked when the |subCommand| is executed by the user.
  registerSubCommand(subCommand, defaultValue, listener) {
    // TODO: Check for ambiguity with the currently known commands.

    this.subCommands_.push({
      command: subCommand,
      defaultValue: defaultValue,

      listener: listener
    });
  }

  // Builds the command constructed by this builder, invoking |commandListener| when it gets used.
  // Top-level commands will be registered with the command manager, whereas sub-commands will be
  // registered with their parent command.
  build(commandListener) {
    this.listener_ = commandListener || null;

    // Builds the listener function that handles dispatching for the current command.
    let listener = this.createListener();

    this.level_ == CommandBuilder.SUB_COMMAND
        ? this.parent_.registerSubCommand(this.command_, this.defaultValue_, listener)
        : this.parent_.registerCommand(this.command_, listener);

    return this.parent_;
  }

  // Internal implementation for creating the listener function. Each listener function follows the
  // same pattern of 
  createListener() {
    return (player, args) => {
      if (this.listener_)
        this.listener_(player, args);
    };
  }
};

// Used for top-level commands of the command builder.
CommandBuilder.COMMAND = 0;

// Used for sub-commands created using the command builder.
CommandBuilder.SUB_COMMAND = 1;

exports = CommandBuilder;
