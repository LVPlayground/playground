// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let numberMatch = /^\s*(\-?\d+(\.\d+)?)(?!\S)/;

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
exports = function NumberParser(argumentString, player) {
  let result = numberMatch.exec(argumentString);
  if (result === null)
    return [argumentString, null];

  return [argumentString.substr(result[0].length), parseFloat(result[1])];
};
