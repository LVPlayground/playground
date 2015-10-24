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
  let result = argumentString.trim();

  if (result.length == 0)
    return [argumentString, null];
  
  return ['', result];
}

// The StringParser class is a reusable implementation of the functionality of parsing a string
// according to a given set of rules. The rules will be defined as a format when constructing the
// parser, after which the parser can be used any number of times.
//
// When creating a parser, the |format| is expected to be an array with zero or more parameter
// definitions, each of which is an object that has at least a `name` and a `type`.
//
// The following parameter `types` are available:
//
// StringParser.PARAM_TYPE_NUMBER   - Will parse a number. This can be either an integer (-100, 100)
//                                    or a decimal (10.25) number.
//
// StringParser.PARAM_TYPE_PLAYER   - Will parse either a number (player id) or a word (nickname).
//                                    When a nickname has been passed, a match will be sought based
//                                    on the online players.
//
// StringParser.PARAM_TYPE_WORD     - Will parse a single word, accepting anything until a space.
//
// StringParser.PARAM_TYPE_SENTENCE - Will parse the remainder of the parameter string.
//
// StringParser.PARAM_TYPE_CUSTOM   - Will use a custom parser (included in the `parser` property of
//                                    the parameter object) to parse the parameter.
//
// After creating the parser, the `parse` function may be used with the input string (and optionally
// a Player instance as context) to apply the parsing rules to said string. Failures will cause
// NULL to be returned, otherwise an array with the parsed properties will be returned.
class StringParser {
  constructor(parameters) {
    this.parameters_ = [];

    if (!parameters)
      return; // there are no parameters

    if (!Array.isArray(parameters))
      throw new Error('The list of parameters is expected to be an array.');

    let hadSentenceParameter = false;
    let hadOptionalParameter = false;

    parameters.forEach(parameter => {
      if (!parameter.hasOwnProperty('name') || !parameter.hasOwnProperty('type'))
        throw new Error('Each parameter must have at least a name and a type.');

      if (hadSentenceParameter)
        throw new Error('No parameter can follow a sentence once - it will swallow everything.');

      // Whether the parameter is required for the command to execute.
      let required = parameter.hasOwnProperty('required') ? !!parameter.required : true;
      if (required && hadOptionalParameter)
        throw new Error('No required parameters may follow an optional parameter.');

      hadOptionalParameter |= !required;

      let parser = null;

      // Iterate over the |type| to determine the parser appropriate for this parameter.
      switch (parameter.type) {
        case StringParser.PARAM_TYPE_NUMBER:
          parser = NumberParser;
          break;
        case StringParser.PARAM_TYPE_PLAYER:
          // not yet implemented.
        case StringParser.PARAM_TYPE_WORD:
          parser = WordParser;
          break;
        case StringParser.PARAM_TYPE_SENTENCE:
          hadSentenceParameter = true;
          parser = SentenceParser;
          break;
        case StringParser.PARAM_TYPE_CUSTOM:
          if (!parameter.hasOwnProperty('parser'))
            throw new Error('Custom parameter types need to have a `parser` defined.');

          parser = parameter.parser;
          break;
        default:
          throw new Error('Invalid parser specified to the string parser.')
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

  // Parses |string| according to the parsing rules. Optionally, |player| may be specified to
  // provide additional context of the person whom this is being parsed for.
  parse(string, player = null) {
    let values = [];

    if (!string)
      return null;

    // Iterate over each of the registered parameters and attempt to parse them using the associated
    // parser. If this fails, and the parameter is not optional, bail out.
    for (let parameter of this.parameters_) {
      let [remainder, value] = parameter.parser(string, player);
      if (value === null) {
        if (parameter.required)
          return null;

        continue;
      }

      string = remainder;
      values.push(value);
    }

    return values;
  }
};

// Parameter types. See the StringParser class for documentation on their behaviour.
StringParser.PARAM_TYPE_NUMBER = 0;
StringParser.PARAM_TYPE_PLAYER = 1;
StringParser.PARAM_TYPE_WORD = 2;
StringParser.PARAM_TYPE_SENTENCE = 3;
StringParser.PARAM_TYPE_CUSTOM = 4;

exports = StringParser;
