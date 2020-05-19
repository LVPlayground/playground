// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

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
function NumberParser(argumentString) {
  let result = StringParser.NUMBER_MATCH.exec(argumentString);
  if (result === null)
    return [argumentString, null];

  return [argumentString.substr(result[0].length), parseFloat(result[1])];
}

// Parameter parser for words. Any sequence of tokens is allowed until the next whitespace.
// The parser will be tested as part of the Command test suite in the parent directory.
function WordParser(argumentString) {
  let result = StringParser.WORD_MATCH.exec(argumentString);
  if (result === null)
    return [argumentString, null];

  let word = result[1].trim();
  if (word.length == 0)
    return [argumentString, null];

  return [argumentString.substr(result[0].length), result[1]];
}

// Parser for matching |value| at the beginning of |argumentString|. The matching will be done in
// a case sensitive manner. Anything that doesn't match |value| will be considered a failure.
function WordMatchParser(argumentString, value) {
  let trimmedArgumentString = argumentString.trimLeft();
  if (!trimmedArgumentString.startsWith(value))
    return [argumentString, null];

  let remainder = trimmedArgumentString.substr(value.length);
  if (remainder.length > 0 && remainder[0] != ' ')
    return [remainder, null];

  return [remainder, value];
}

// Parameter parser for sentences. A trimmed version of the argument string will be returned.
function SentenceParser(argumentString) {
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
// definitions, each of which is an object that has at least a `type`.
//
// The following parameter `types` are available:
//
// StringParser.PARAM_TYPE_NUMBER   - Will parse a number. This can be either an integer (-100, 100)
//                                    or a decimal (10.25) number.
//
// StringParser.PARAM_TYPE_WORD     - Will parse a single word, accepting anything until a space.
//
// StringParser.PARAM_TYPE_SENTENCE - Will parse the remainder of the parameter string.
//
// StringParser.PARAM_TYPE_CUSTOM   - Will use a custom parser (included in the `parser` property of
//                                    the parameter object) to parse the parameter.
//
// Additionally a string may be passed which means that a strict, case-sensitive match will be done
// on the existence of that string in the input data.
//
// After creating the parser, the `parse` function may be used with the input string to apply the
// parsing rules to said string. Failures will cause NULL to be returned, otherwise an array with
// the parsed properties will be returned.
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
      if (hadSentenceParameter)
        throw new Error('No parameter can follow a sentence once - it will swallow everything.');

      if (typeof parameter === 'number')
        parameter = { type: parameter };

      if (typeof parameter === 'string')
        parameter = { type: StringParser.PARAM_TYPE_WORD_MATCH, value: parameter };

      if (!parameter.hasOwnProperty('type'))
        throw new Error('Each parameter must have at least a type.');

      // Whether the parameter is optional for the command to execute.
      let optional = parameter.hasOwnProperty('optional') ? !!parameter.optional : false;
      if (!optional && hadOptionalParameter)
        throw new Error('No required parameters may follow an optional parameter.');

      hadOptionalParameter = hadOptionalParameter || optional;

      let defaultValue = null;

      // Whether a default value has been given to the parameter.
      if (optional && parameter.defaultValue !== null && parameter.defaultValue !== undefined) {
        if (!['boolean', 'number', 'string'].includes(typeof parameter.defaultValue))
          throw new Error('Default values may only be booleans, numbers and strings.');
        
        defaultValue = parameter.defaultValue;
      }

      let value = parameter.hasOwnProperty('value') ? parameter.value : null;

      let error = null;
      let parser = null;

      // Iterate over the |type| to determine the parser appropriate for this parameter.
      switch (parameter.type) {
        case StringParser.PARAM_TYPE_NUMBER:
          parser = NumberParser;
          break;
        case StringParser.PARAM_TYPE_WORD:
          parser = WordParser;
          break;
        case StringParser.PARAM_TYPE_WORD_MATCH:
          parser = WordMatchParser;
          break;
        case StringParser.PARAM_TYPE_SENTENCE:
          hadSentenceParameter = true;
          parser = SentenceParser;
          break;
        case StringParser.PARAM_TYPE_CUSTOM:
          if (!parameter.hasOwnProperty('parser'))
            throw new Error('Custom parameter types need to have a `parser` defined.');

          parser = parameter.parser;
          if (parameter.hasOwnProperty('error'))
            error = parameter.error;

          break;
        default:
          throw new Error('Invalid parser specified to the string parser.')
      }

      // Push the sanitized parameter information to the local state.
      this.parameters_.push({ optional, parser, error, defaultValue, value });
    });
  }

  // Parses |string| according to the parsing rules. An array with the values will be returned when
  // parsing was successful. Otherwise, NULL will be returned instead.
  parse(string, context = null) {
    if (typeof string != 'string')
      throw new Error('Only strings can be parsed using the StringParser.');

    let values = [];

    // Iterate over each of the registered parameters and attempt to parse them using the associated
    // parser. If this fails, and the parameter is not optional, bail out.
    for (let parameter of this.parameters_) {
      let [remainder, value] = parameter.parser(string, parameter.value, context);
      if (value !== null) {
        if (parameter.value === null)
          values.push(value);

        string = remainder;
        continue;
      }

      if (string.length) {
        if (parameter.error)
          return parameter.error;

        return StringParser.ERROR_MISSING_PARAMETER;
      }

      if (!parameter.optional)
        return StringParser.ERROR_MISSING_PARAMETER

      if (parameter.defaultValue !== null)
        values.push(parameter.defaultValue);
      else
        values.push(undefined);
    }

    return values;
  }
};

// Regular expressions used to detect different kinds of parameters.
StringParser.NUMBER_MATCH = /^\s*(\-?\d+(\.\d+)?)(?!\S)/;
StringParser.WORD_MATCH = /^\s*(.+?)(?!\S)/;

// Parameter types. See the StringParser class for documentation on their behaviour.
StringParser.PARAM_TYPE_NUMBER = 0;
StringParser.PARAM_TYPE_WORD = 1;
StringParser.PARAM_TYPE_WORD_MATCH = 2;
StringParser.PARAM_TYPE_SENTENCE = 3;
StringParser.PARAM_TYPE_CUSTOM = 4;

// Error messages that can be returned by the string parser instead of NULL.
StringParser.ERROR_MISSING_PARAMETER = 0;
StringParser.ERROR_MISSING_PLAYER_PARAMETER = 1;

export default StringParser;
