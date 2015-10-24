// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Represents a command that can be executed by players. Each command has at least a name and a
// listener, and will most likely also have one or more parameters that the player can use to
// customize behavior of the listener.
//
// Read the online documentation for more information on the parameter syntax:
//   https://github.com/LVPlayground/playground/tree/master/javascript/components/command_manager
class Command {
  constructor(name, parameters, listener) {
    this.name_ = name;
    this.listener_ = listener;
    this.parameters_ = [];

    // Require the |parameters| to be in valid format.
    this.setParameters(parameters);
  }

  // Returns the name of this command.
  get name() { return this.name_; }

  // Updates the parameters expected for this command to |parameters|.
  //
  // The |parameters| are expected to be an array with zero or more parameter definitions, each of
  // which is an object that has at least a `name` and a `type`. These `type`s are available:
  //
  // Command.PARAM_TYPE_NUMBER   - Will parse a number. This can be either an integer (-100, 100), a
  //                               decimal (10.25) or a scientific number (10e5).
  //
  // Command.PARAM_TYPE_PLAYER   - Will parse either a number (player id) or a word (nickname).
  //                               When a nickname has been passed, a match will be sought based on
  //                               the online players.
  //
  // Command.PARAM_TYPE_WORD     - Will parse a single word, accepting anything until a space.
  //
  // Command.PARAM_TYPE_SENTENCE - Will parse the remainder of the parameter string.
  //
  // Command.PARAM_TYPE_CUSTOM   - Will use a custom parser (included in the `parser` property of
  //                               the parameter object) to parse the parameter.
  //
  // Read the online documentation for more information on the |parameters| syntax:
  //   https://github.com/LVPlayground/playground/tree/master/javascript/components/command_manager
  setParameters(parameters) {
    if (!parameters)
      return; // there are no parameters

    if (!Array.isArray(parameters))
      throw new Error('The list of parameters is expected to be an array.');

    let hadSentenceParameter = false;
    parameters.forEach(parameter => {
      if (!parameter.hasOwnProperty('name') || !parameter.hasOwnProperty('type'))
        throw new Error('Each parameter must have at least a name and a type.');

      if (hadSentenceParameter)
        throw new Error('No parameters can follow a sentence once - it will swallow everything.');

      // Whether the parameter is required for the command to execute.
      let required = parameter.hasOwnProperty('required') ? !!parameter.required : false;

      let parser = null;

      // Iterate over the |type| to determine the parser appropriate for this parameter.
      switch (parameter.type) {
        case Command.PARAM_TYPE_NUMBER:
        case Command.PARAM_TYPE_PLAYER:
        case Command.PARAM_TYPE_WORD:
          // not yet implemented.
          break;
        case Command.PARAM_TYPE_SENTENCE:
          // not yet implemented.

          hadSentenceParameter = true;
          break;
        case Command.PARAM_TYPE_CUSTOM:
          if (!parameter.hasOwnProperty('parser'))
            throw new Error('Custom parameter types need to have a `parser` defined.');

          parser = new parameter.parser(this);
          break;
      }

      // Push the sanitized parameter information to the local state.
      this.parameters_.push({
        name: parameter.name,
        required: required,
        parser: parser
      });
    });
  }

  // Converts the command back to a string. This string can be displayed to players to give them
  // information about how to execute the command.
  toString() {
    let command = '/' + this.name_;
    this.parameters_.forEach(parameter =>
        command += ' [' + parameter.name + ']');
    
    return command;
  }
};

// Parameter types. See Command.setParameters() for documentation on their behaviour.
Command.PARAM_TYPE_NUMBER = 0;
Command.PARAM_TYPE_PLAYER = 1;
Command.PARAM_TYPE_WORD = 2;
Command.PARAM_TYPE_SENTENCE = 3;
Command.PARAM_TYPE_CUSTOM = 4;

exports = Command;
