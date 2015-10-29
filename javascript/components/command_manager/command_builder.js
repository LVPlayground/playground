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
    this.hasWordSubcommand_ = false;
  }

  // Returns a human readable name of the command that's currently in process of being build.
  get name() {
    // TODO: Improve name generation in the command builder.
    return this.command_;
  }

  // Creates a new sub-command for the current command builder. The |subCommand| must be unique and,
  // when |defaultValue| is used, unambiguous from any of the other registered commands.
  sub(subCommand, defaultValue = null) {
    if (typeof subCommand == 'number' && !CommandBuilder.ALLOWED_SUBCOMMANDS.includes(subCommand))
      throw new Error('Invalid sub-command type passed (only NUMBER, WORD and PLAYER are allowed).');

    if (defaultValue !== null) {
      if (typeof subCommand != 'number')
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

    // No further parameters may be added if the command represented by |builder| is a catch-all
    // word parameter, because that causes ambiguity in the execution order.
    if (builder.command_ == CommandBuilder.WORD_PARAMETER)
      this.hasWordSubcommand_ = true;

    this.subCommands_.push({ builder, listener });
  }

  // Verifies that |command| is unambiguous with any other command registered in the |builder|. Will
  // check recursively for parameters that have a default value.
  ensureUnambiguous(builder, newCommand) {
    if (builder.hasWordSubcommand_)
      throw new Error('"' + newCommand.name + '" must be defined before the WORD_PARAMETER command.');

    for (let subCommand of builder.subCommands_) {
      if (subCommand.builder.defaultValue_ !== null)
        this.ensureUnambiguous(subCommand.builder, newCommand);

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
    return (player, argumentString, carriedArguments = []) => {
      // Make sure that any leading padding is removed from |args|.
      argumentString = argumentString.trim();

      // Determine if there is a sub-command that we should delegate to. Word matching is used for
      // string values (which will be the common case for delegating commands.)
      for (let { builder, listener } of this.subCommands_) {
        if (typeof builder.command_ == 'string') {
          let commandLength = builder.command_.length;
          if (!argumentString.startsWith(builder.command_) || (argumentString.length != commandLength && argumentString[commandLength] != ' '))
            continue;

          return listener(player, argumentString.substr(commandLength), carriedArguments);
        }

        let result = null;
        switch (builder.command_) {
          case CommandBuilder.NUMBER_PARAMETER:
            result = StringParser.NUMBER_MATCH.exec(argumentString);
            if (result === null)
              break;

            return listener(player, argumentString.substr(result[0].length), [ ...carriedArguments, parseFloat(result[0]) ]);

          case CommandBuilder.WORD_PARAMETER:
            result = StringParser.WORD_MATCH.exec(argumentString);
            if (result === null)
              break;

            return listener(player, argumentString.substr(result[0].length), [ ...carriedArguments, result[0] ]);

          case CommandBuilder.PLAYER_PARAMETER:
            result = StringParser.WORD_MATCH.exec(argumentString);
            if (result === null)
              break;

            let subject = Player.find(result[0]);
            if (subject === null)
              break;

            return listener(player, argumentString.substr(result[0].length), [ ...carriedArguments, subject ]);
        }

        // If the sub-command has a default value function defined, attempt to get its value by
        // invoking it with |player|. Return values of NULL indicate that the value should not hit.
        if (builder.defaultValue_ !== null) {
          let value = builder.defaultValue_(player);
          if (value !== null)
            return listener(player, argumentString, [ ...carriedArguments, value ]);
        }
      }

      // TODO: Parse the parameters associated with this command.

      if (this.listener_) {
        this.listener_(player, ...carriedArguments);
        return true;
      }

      // TODO: Create a sensible default handler for the command.

      return false;
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

// Allowed argument types for sub-command identification. Sentences are not
// allowed here because they don't make sense as a sub-command - they should be
// parameters to a given command instead.
CommandBuilder.ALLOWED_SUBCOMMANDS = [CommandBuilder.NUMBER_PARAMETER,
                                      CommandBuilder.WORD_PARAMETER,
                                      CommandBuilder.PLAYER_PARAMETER];

exports = CommandBuilder;
