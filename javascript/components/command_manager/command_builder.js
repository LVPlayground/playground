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
  registerSubCommand(builder, listener) {
    let subCommand = {
      command: builder.command_,
      defaultValue: builder.defaultValue_,

      listener: listener
    };

    // Ensures that |subCommand| is unambiguous in context of |this|. Will throw an exception if the
    // command cannot be resolved unambiguously.
    this.ensureUnambiguous(this, subCommand);

    this.subCommands_.push(subCommand);
  }

  // Verifies that |command| is unambiguous with any other command registered in the |builder|. Will
  // check recursively for parameters that have a default value.
  ensureUnambiguous(builder, newCommand) {
    for (let subCommand of builder.subCommands_) {
      if (subCommand.command == newCommand.command)
        throw new Error('The command is ambiguous.');  // TODO: Improve the error message.

      // TODO: Check for ambiguity of commands with default parameters.
    }
  }

  // Builds the command constructed by this builder, invoking |commandListener| when it gets used.
  // Top-level commands will be registered with the command manager, whereas sub-commands will be
  // registered with their parent command.
  build(commandListener) {
    this.listener_ = commandListener || null;

    // Builds the listener function that handles dispatching for the current command.
    let listener = this.createListener();

    this.level_ == CommandBuilder.SUB_COMMAND
        ? this.parent_.registerSubCommand(this, listener)
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

// The different kinds of dynamic arguments recognized by the command builder.
CommandBuilder.NUMBER_PARAMETER = 0;
CommandBuilder.WORD_PARAMETER = 1;
CommandBuilder.SENTENCE_PARAMETER = 2;
CommandBuilder.PLAYER_PARAMETER = 3;


exports = CommandBuilder;
