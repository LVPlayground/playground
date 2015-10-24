// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let numberMatch = /^\s*(\-?\d+(\.\d+)?)(?!\S)/;
let wordMatch = /^\s*(.+?)(?!\S)/;

// Parameter parser for numbers. The following notations for numbers are supported:
//
// "42"        Positive integral number.
// "-42"       Negative integral number.
// "42.50"     Positive decimal numbers.
// "-42.50"    Negative decimal numbers.
//
// Note that the numbers will not be limited to the signed 32-bit integer range that Pawn is limited
// to - JavaScript numbers have a 53-bit mantissa.
//
// The parser will be tested as part of the Command test suite in the parent directory.
function NumberParser(argumentString, player) {
  let result = numberMatch.exec(argumentString);
  if (result === null)
    return [argumentString, null];

  return [argumentString.substr(result[0].length), parseFloat(result[1])];
}

// Parameter parser for words. Any sequence of tokens is allowed until the next whitespace.
// The parser will be tested as part of the Command test suite in the parent directory.
function WordParser(argumentString, player) {
  let result = wordMatch.exec(argumentString);
  if (result === null)
    return [argumentString, null];

  return [argumentString.substr(result[0].length), result[1]];
}

// Parameter parser for sentences. A trimmed version of the argument string will be returned.
function SentenceParser(argumentString, player) {
  // TODO(Russell): Should we normalize multiple spaces to a single space?
  return ['', argumentString.trim()];
}

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
          parser = NumberParser;
          break;
        case Command.PARAM_TYPE_PLAYER:
          // not yet implemented.
        case Command.PARAM_TYPE_WORD:
          parser = WordParser;
          break;
        case Command.PARAM_TYPE_SENTENCE:
          hadSentenceParameter = true;
          parser = SentenceParser;
          break;
        case Command.PARAM_TYPE_CUSTOM:
          if (!parameter.hasOwnProperty('parser'))
            throw new Error('Custom parameter types need to have a `parser` defined.');

          parser = parameter.parser;
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

  // Dispatches the command to the listener when the passed arguments are valid, or displays an
  // error message to the player when a problem has been found.
  dispatch(player, args) {
    let inputArguments = args + ' ',
        parsedArguments = [];

    // Iterate over each of the registered parameters and attempt to parse them using the associated
    // parser. If this fails, and the parameter is not optional, bail out.
    for (let parameter of this.parameters_) {
      let [argumentRemainder, value] = parameter.parser(args, player);
      if (value === null && parameter.required) {
        console.log('Unable to execute command');  // TODO: inform the player of the problem.
        return;
      }

      args = argumentRemainder;
      parsedArguments.push(value);
    }

    // Invoke the attached listener with the player, as well as all the passed arguments.
    this.listener_(player, ...parsedArguments);
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
