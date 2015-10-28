// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let StringParser = require('base/string_parser.js');

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

  // Returns a human readable name of the command that's currently in process of being build.
  get name() {
    // TODO: Improve name generation in the command builder.
    return this.command_;
  }

  // Creates a new sub-command for the current command builder. The |subCommand| must be unique and,
  // when |defaultValue| is used, unambiguous from any of the other registered commands.
  sub(subCommand, defaultValue = null) {
    if (defaultValue !== null) {
      if (typeof subCommand != 'number' || subCommand < 0 || subCommand > 3)
        throw new Error('Default sub-command values only make sense with one of the CommandBuilder.*_PARAMETER values.');

      if (typeof defaultValue != 'function')
        throw new Error('Default values must be provided through a function that takes a player.');
    }

    return new CommandBuilder(CommandBuilder.SUB_COMMAND, this, subCommand, defaultValue);
  }

  // Internal API for adding |subCommand| to the list of known sub-commands. The |listener| will be
  // invoked when the |subCommand| is executed by the user.
  registerSubCommand(builder, listener) {
    // Ensures that |subCommand| is unambiguous in context of |this|. Will throw an exception if the
    // command cannot be resolved unambiguously.
    this.ensureUnambiguous(this, builder);

    // If |builder| has a default value *and* sub-commands, we also need to verify that each of the
    // sub-commands are not ambiguous with commands already known in this builder.
    if (builder.defaultValue_ !== null) {
      builder.subCommands_.forEach(subCommand =>
          this.ensureUnambiguous(this, subCommand.builder));
    }

    this.subCommands_.push({ builder, listener });
  }

  // Verifies that |command| is unambiguous with any other command registered in the |builder|. Will
  // check recursively for parameters that have a default value.
  ensureUnambiguous(builder, newCommand) {
    for (let subCommand of builder.subCommands_) {
      if (subCommand.builder.defaultValue_ !== null)
        ensureUnambiguous(subCommand.builder, newCommand);

      if (subCommand.builder.command_ == newCommand.command_)
        throw new Error('"' + newCommand.name + '" is ambiguous with "' + subCommand.builder.name + '".');
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
      // Determine if there is a sub-command that we should delegate to. Word matching is used for
      // string values (which will be the common case for delegating commands.)
      for (let { builder, listener } of this.subCommands_) {
        if (typeof builder.command_ == 'string') {
          let commandLength = builder.command_.length;
          if (!args.startsWith(builder.command_) || (args.length != commandLength && args[commandLength] != ' '))
            continue;

          return listener(player, args.substr(commandLength + 1));
        }

        // TODO: Implement matching for the CommandManager.*_PARAMETER types.
      }

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
