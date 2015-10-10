// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Ensuring proper functionality of any component within Las Venturas Playground
 * should be done by testing it. This framework provides a number of utility
 * features which will be called automatically, and some which you have to call
 * yourself in order to inform the console of the result.
 *
 * How to write a test?
 *
 * Firstly, create a stock function which has "Test" in the name. While this is
 * not required, it makes it a lot clearer.
 * Then inform the pre-compiler that the function is a test-case. You do this by
 * adding the following pragma rule:
 *
 *     #pragma testcase myAwesomeFeatureTest
 *
 * Test as many functions, conditionals and statusses as you can think of within
 * your test. The more, the better. You test them using asserts, the following
 * of which are available:
 *
 *     assert_equals(actualResult, expectedResult, name[])
 *     assert_string_equals(actual[], expected[], name[])
 *     assert_different(actualResult, invalidResult, name[])
 *     assert_string_different(actual[], expected[], name[])
 *     assert_less_than(actualResult, maximumResult, name[])
 *     assert_less_than_or_equal_to(actualResult, maximumResult, name[])
 *     assert_greater_than(actualResult, minimumResult, name[])
 *     assert_greater_than_or_equal_to(actualResult, minimumResult, name[])
 *     assert_true(condition)
 *     assert_false(condition)
 *
 * The name should be short but descriptive. Your test function can contain any
 * number of asserts. Once again: the more, the better.
 *
 * Tests will be executed as the very first part of starting the gamemode. This
 * means that callbacks such as OnGameModeInit have not been invoked yet. They
 * will only be exectued if you compile the gamemode in debug mode. That means
 * that the following rule must be declared at the top of lvp.pwn:
 *
 *     #pragma debug 1
 *
 * Write tests. No really, you should. They make debugging problems a lot easier
 * and much more convenient. They force you to write quality code. Asserts have
 * no overhead at all if debug mode is not enabled.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */

/**
 * The TestManager will keep track of the number of tests in the gamemode, the number
 * of failed tests and outputting test results. Input to this class will be decided
 * based on input from the separate assertion functions.
 */
class TestManager {
    /**
     * Keep track of how many tests for this run of the gamemode have failed. Any number
     * higher than zero indicates that a (serious) problem with the gamemode exists,
     * which should be fixed as soon as possible.
     *
     * @var integer
     */
    new m_failedTestCount = 0;

    /**
     * Keep track of the total number of tests run. The higher the number, the better.
     * When talking about tests quantity is an important factor, but please keep them sane.
     *
     * @var integer
     */
    new m_totalTestCount = 0;

    /**
     * Get the number of tests which have failed during the gamemode's start-up sequence.
     * This number should always be zero in release builds.
     *
     * @return integer
     */
    public inline failedTestCount() {
        return (m_failedTestCount);
    }

    /**
     * Get a handle on the total number of tests which have been run during the gamemode's
     * start-up sequence. Random asserts later on in the gamemode have not been included. 
     *
     * @return integer
     */
    public inline totalTestCount() {
        return (m_totalTestCount);
    }

    /**
     * Increment the number of total tests the gamemode has run. This should be done by
     * the output aggregation methods for complete flexibility with the actual asserts.
     */
    public inline incrementTotalTestCount() {
        m_totalTestCount += 1;
    }

    /**
     * Increment the number of tests which has failed during the gamemode's start-up
     * sequence. As said lots of time earlier, this should be equal to zero.
     */
    public inline incrementFailedTestCount() {
        m_failedTestCount += 1;
    }
};


#if __DEBUG__ >= 1

    #define TEST_RESULT_PASS    "PASS"
    #define TEST_RESULT_FAIL    "FAIL"

    /**
     * The active test-suite name needs to be known in order to efficiently find
     * the test which is failing. This gets updated automatically.
     *
     * @var string
     */
    new activeTestSuiteName[64];

    /**
     * Should the test-suite runs be verbose? By default, release mode will only
     * display failed tests (and if any, block the game-mode), while debug mode
     * will display all ran tests and results.
     *
     * @var boolean
     */
    new bool: shouldTestSuitesBeVerbose = false;

    /**
     * By invoking this method, which will be added by the pre-compiler if the
     * debug level has been enabled, test suite verbosity will be enabled.
     *
     * @param verbosity Should the tests be run in a verbose manner?
     */
    stock test_suites_start_verbose(bool: verbosity = true) {
        shouldTestSuitesBeVerbose = verbosity && false;
    }

    /**
     * This callback will run after all tests have finished running. In here,
     * statistics and overviews may be displayed to the gamemode start.
     */
    stock test_suites_finished() {}

    /**
     * Updating the active test-suite name will be done using an invocation to
     * this function. The pre-compiler will take care of this automatically.
     *
     * @param string name Name of the to-be-started test-suite
     */
    stock test_suite_name(name[]) {
        format(activeTestSuiteName, sizeof(activeTestSuiteName), "%s", name);
    }

    /**
     * Closes the active test-suite by wiping out the suite's name.
     */
    stock test_suite_close() {
        activeTestSuiteName[0] = 0;
    }

    /**
     * Returns whether a test suite is currently active.
     */
    stock bool: is_running_test() {
        return activeTestSuiteName[0] != 0;
    }

    // What kind of comparison should be done when looking at the actual and expected values?
    enum TestComparisonType {
        IntegersEqual,
        IntegersDifferent,
        IntegersLessThan,
        IntegersLessThanOrEqualTo,
        IntegersGreaterThan,
        IntegersGreaterThanOrEqualTo,
        StringsEqual,
        StringsDifferent
    };

    /**
     * Assert whether two integer results are comparable to each other using an comparison type.
     *
     * @param actualResult The actual result from this expression.
     * @param comparisonResult The value to compare the result against.
     * @param comparisonType The type of comparison that should be done.
     * @param string name Name of the test which we're dealing with.
     */
    stock assert_integer_result(actualResult, comparisonResult, TestComparisonType: comparisonType, name[]) {
        new bool: passed = false;
        switch(comparisonType) {
            case IntegersEqual:
                passed = actualResult == comparisonResult;
            case IntegersDifferent:
                passed = actualResult != comparisonResult;
            case IntegersLessThan:
                passed = actualResult < comparisonResult;
            case IntegersLessThanOrEqualTo:
                passed = actualResult <= comparisonResult;
            case IntegersGreaterThan:
                passed = actualResult > comparisonResult;
            case IntegersGreaterThanOrEqualTo:
                passed = actualResult >= comparisonResult;
        }

        TestManager->incrementTotalTestCount();
        if (passed == false)
            TestManager->incrementFailedTestCount();

        if (passed == false && activeTestSuiteName[0] != 0)
            printf("%s  [%s] %s (was: %d)", TEST_RESULT_FAIL, activeTestSuiteName, name, actualResult);
        else if (passed == false)
            printf("%s  [--] %s (was: %d)", TEST_RESULT_FAIL, name, actualResult);
        else if (passed == true && shouldTestSuitesBeVerbose && activeTestSuiteName[0] != 0)
            printf("%s  [%s] %s", TEST_RESULT_PASS, activeTestSuiteName, name);
        else if (passed == true && shouldTestSuitesBeVerbose)
            printf("%s  [--] %s", TEST_RESULT_PASS, name);
    }

    #define assert_equals(%0,%1,%2) \
        assert_integer_result(_:(%0), _:(%1), IntegersEqual, (%2))

    #define assert_different(%0,%1,%2) \
        assert_integer_result(_:(%0), _:(%1), IntegersDifferent, (%2))

    #define assert_less_than(%0,%1,%2) \
        assert_integer_result(_:(%0), _:(%1), IntegersLessThan, (%2))

    #define assert_less_than_or_equal_to(%0,%1,%2) \
        assert_integer_result(_:(%0), _:(%1), IntegersLessThanOrEqualTo, (%2))

    #define assert_greater_than(%0,%1,%2) \
        assert_integer_result(_:(%0), _:(%1), IntegersGreaterThan, (%2))

    #define assert_greater_than_or_equal_to(%0,%1,%2) \
        assert_integer_result(_:(%0), _:(%1), IntegersGreaterThanOrEqualTo, (%2))

    /**
     * Assert whether two string results are comparable to each other using an comparison type.
     *
     * @param actualResult The actual string from this expression.
     * @param comparisonResult The string to compare the result against.
     * @param comparisonType The type of comparison that should be done.
     * @param string name Name of the test which we're dealing with.
     */
    stock assert_string_result(actualResult[], comparisonResult[], TestComparisonType: comparisonType, name[]) {
        new bool: passed = false;
        switch(comparisonType) {
            case StringsEqual:
                passed = strlen(actualResult) == strlen(comparisonResult) &&
                         strcmp(comparisonResult, actualResult, false) == 0;
            case StringsDifferent:
                passed = strlen(actualResult) != strlen(comparisonResult) ||
                         strcmp(comparisonResult, actualResult, false) != 0;
        }

        TestManager->incrementTotalTestCount();
        if (passed == false)
            TestManager->incrementFailedTestCount();

        if (passed == false && activeTestSuiteName[0] != 0)
            printf("%s  [%s] %s (was: \"%s\")", TEST_RESULT_FAIL, activeTestSuiteName, name, actualResult);
        else if (passed == false)
            printf("%s  [--] %s (was: \"%s\")", TEST_RESULT_FAIL, name, actualResult);
        else if (passed == true && shouldTestSuitesBeVerbose && activeTestSuiteName[0] != 0)
            printf("%s  [%s] %s", TEST_RESULT_PASS, activeTestSuiteName, name);
        else if (passed == true && shouldTestSuitesBeVerbose)
            printf("%s  [--] %s", TEST_RESULT_PASS, name);
    }

    #define assert_string_equals(%0,%1,%2) \
        assert_string_result((%0), (%1), StringsEqual, (%2))

    #define assert_string_different(%0,%1,%2) \
        assert_string_result((%0), (%1), StringsDifferent, (%2))

#else

    /** If the gamemode has not been compiled with debugging information, make
        sure that code using one of the asserts will not break. **/

    #define test_suite_name(%0); {}
    #define test_suite_close(); {}
    #define display_integer_test_result(%0,%1,%2); {}

    #define assert_equals(%0,%1,%2); {}
    #define assert_different(%0,%1,%2); {}
    #define assert_less_than(%0,%1,%2); {}
    #define assert_less_than_or_equal_to(%0,%1,%2); {}
    #define assert_greater_than(%0,%1,%2); {}
    #define assert_greater_than_or_equal_to(%0,%1,%2); {}

    #define assert_string_equal(%0,%1,%2); {}
    #define assert_string_different(%0,%1,%2); {}

    #define test_suites_start_verbose(); {}
    #define test_suites_finished(); {}

#endif
