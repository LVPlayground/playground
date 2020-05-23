// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

#pragma testcase CommandTestSuite

CommandTestSuite() {
    new stringParam[32]; // used as a buffer for string parameters.

    // Counting the number of parameters in a string will be determined based on the amount of
    // whitespace. Specifically, multiple spaces should be considered as a single whitespace.
    assert_equals(Command->parameterCount(""), 0, "An empty string means no parameters.");
    assert_equals(Command->parameterCount("hello"), 1, "A string without spaces means one parameter.");
    assert_equals(Command->parameterCount("hello world"), 2, "A string with a space has two parameters.");
    assert_equals(Command->parameterCount("hello  world"), 2, "Multiple spaces should be seen as a single separator.");
    assert_equals(Command->parameterCount("hello world   how!!  are you?"), 5, "Longer strings with a mixture of separators should work.");
    assert_equals(Command->parameterCount(" hello world"), 2, "Strings starting with spaces should have these ignored.");
    assert_equals(Command->parameterCount("  "), 0, "A string with only spaces should be considered empty.");

    // Test that we can retrieve command parameters as strings.
    Command->stringParameter("hello world", 0, stringParam, sizeof(stringParam));
    assert_string_equals(stringParam, "hello", "Retrieving the first parameter as a string should work.");

    Command->stringParameter("hello world", 1, stringParam, sizeof(stringParam));
    assert_string_equals(stringParam, "world", "Retrieving the second parameter as a string should work.");

    Command->stringParameter("  hello world how!   are  you?", 4, stringParam, sizeof(stringParam));
    assert_string_equals(stringParam, "you?", "Retrieving a string parameter should ignore leading and multiple spaces.");

    Command->stringParameter("hello world", 3, stringParam, sizeof(stringParam));
    assert_string_equals(stringParam, "", "Retrieving invalid string parameters should return an empty string.");

    // Test that we can retrieve command parameters as booleans.
    assert_equals(Command->booleanParameter("1", 0), true, "Retrieving a simple boolean parameter as '1' should work.");
    assert_equals(Command->booleanParameter("x yes 5", 1), true, "Retrieving 'yes' as a boolean parameter should work.");
    assert_equals(Command->booleanParameter("x foo true", 2), true, "Retrieving 'true' as a boolean parameter should work.");
    assert_equals(Command->booleanParameter("", 5), false, "Retrieving boolean parameters should default to false.");
    assert_equals(Command->booleanParameter("no", 0), false, "Anything other than '1', 'yes' and 'true' should be false.");

    // Test that we can retrieve command parameters as integers.
    assert_equals(Command->integerParameter("25 1", 0), 25, "Retrieving the first integer parameter should work.");
    assert_equals(Command->integerParameter("25 1 13 52", 2), 13, "Retrieving subsequent integer parameters should work.");
    assert_equals(Command->integerParameter("  25   1  13! 52", 2), 13, "Invalid integer parameters should parse up to the valid boundary.");
    assert_equals(Command->integerParameter("  25   1  XXX 52", 2), -1, "Invalid integer parameters should return -1 when completely invalid.");
    assert_equals(Command->integerParameter("  25   1  13! 52", 3), 52, "Retrieving integer parameters should work regardless of spacing.");
    assert_equals(Command->integerParameter("0 -25", 1), -25, "Retrieving negative integer parameters should work.");
    assert_equals(Command->integerParameter("25 1",  2), -1, "Retrieving positive invalid parameters should return -1.");
    assert_equals(Command->integerParameter("25 1", -2), -1, "Retrieving negative invalid parameters should return -1.");

    // Test that we can retrieve command parameters as floats.
    assert_equals(Command->floatParameter("25.5 124 01", 0), 25.5, "Retrieving the first float parameter should work.");
    assert_equals(Command->floatParameter("  25.5   124 01", 1), 124.0, "Retrieving numbers without decimals should work.");
    assert_equals(Command->floatParameter("25.5 124 01", 5), -1.0, "Retrieving out of bound floating point numbers should work.");

    // Computing hashes of more popular strings should work. Without this many of the commands will
    // be broken, so it's quite critical that this works correctly.
    assert_equals(Command->hash("hello"), 918389611, "The text \"hello\" hashes correctly.");
    assert_equals(Command->hash("login"), 1507583491, "The text \"login\" hashes correctly.");
    assert_equals(Command->hash("las venturas"), -1985849769, "The text \"las venturas\" hashes correctly.");
}
