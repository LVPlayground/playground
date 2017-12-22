// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import AssertionFailedError from 'base/test/assertion_failed_error.js';
import MockPawnInvoke from 'base/test/mock_pawn_invoke.js';

// This library provides a series of asserts that can be used for validating assumptions in unit
// tests. Failing asserts will create clear and useful error messages.
//
// This library implements the Chai assertion API, as documented here:
//     http://chaijs.com/api/assert/
class Assert {
  constructor(suite, description) {
    this.suite_ = suite;
    this.description_ = description;
  }

  // -----------------------------------------------------------------------------------------------

  // Asserts |object|
  ok(object) {
    if (object)
      return;

    this.reportFailure('is not ok');
  }

  // Asserts !|object|
  notOk(object) {
    if (!object)
      return;

    this.reportFailure('is ok');
  }

  // Asserts |actual| == |expected|.
  equal(actual, expected) {
    if (actual == expected)
      return;

    this.reportFailure('expected ' + this.toString(expected) + ', but got ' + this.toString(actual));
  }

  // Asserts |actual| != |expected|.
  notEqual(actual, expected) {
    if (actual != expected)
      return;

    this.reportFailure('unexpectedly equals ' + this.toString(expected));
  }

  // Asserts |actual| === |expected|.
  strictEqual(actual, expected) {
    if (actual === expected)
      return;

    this.reportFailure('expected ' + this.toString(expected) + ', but got ' + this.toString(actual));
  }

  // Asserts |actual| !== |expected|.
  notStrictEqual(actual, expected) {
    if (actual !== expected)
      return;

    this.reportFailure('unexpectedly equals ' + this.toString(expected));
  }

  // Asserts that |actual| is deep equal to |expected|.
  deepEqual(actual, expected) {
    if (angularEquals(actual, expected))
      return;

    // TODO(Russell): Improve this error message.
    this.reportFailure('is not deep equal to ' + this.toString(expected));
  }

  // Asserts that |actual| is not deep equal to |expected|.
  notDeepEqual(actual, expected) {
    if (!angularEquals(actual, expected))
      return;

    // TODO(Russell): Improve this error message.
    this.reportFailure('is deep equal to ' + this.toString(expected));
  }

  // Asserts |value| == true.
  isTrue(value) {
    if (value)
      return;

    this.reportFailure('evaluates to false');
  }

  // Asserts valueToCheck > valueToBeAbove
  isAbove(valueToCheck, valueToBeAbove) {
    if (valueToCheck > valueToBeAbove)
      return;

    this.reportFailure('expected ' + this.toString(valueToCheck) + ' to be above ' + this.toString(valueToBeAbove));
  }

  // Asserts valueToCheck >= valueToBeAboveOrEqual
  // This is an addition for Las Venturas Playground.
  isAboveOrEqual(valueToCheck, valueToBeAboveOrEqual) {
    if (valueToCheck >= valueToBeAboveOrEqual)
      return;

    this.reportFailure('expected ' + this.toString(valueToCheck) + ' to be equal to or above ' + this.toString(valueToBeAboveOrEqual));
  }

  // Asserts valueToCheck < valueToBeBelow
  isBelow(valueToCheck, valueToBeBelow) {
    if (valueToCheck < valueToBeBelow)
      return;

    this.reportFailure('expected ' + this.toString(valueToCheck) + ' to be below ' + this.toString(valueToBeBelow));
  }

  // Asserts valueToCheck <= valueToBeBelowOrEqual
  // This is an addition for Las Venturas Playground.
  isBelowOrEqual(valueToCheck, valueToBeBelowOrEqual) {
    if (valueToCheck <= valueToBeBelowOrEqual)
      return;

    this.reportFailure('expected ' + this.toString(valueToCheck) + ' to be equal to or below ' + this.toString(valueToBeBelowOrEqual));
  }

  // Asserts |value| == false.
  isFalse(value) {
    if (!value)
      return;

    this.reportFailure('evaluates to true');
  }

  // Asserts |value| === null.
  isNull(value) {
    if (value === null)
      return;

    this.reportFailure('expected NULL, but got ' + this.toString(value));
  }

  // Asserts |value| !== null.
  isNotNull(value) {
    if (value !== null)
      return;

    this.reportFailure('evaluates to NULL');
  }

  // Asserts |value| === undefined.
  isUndefined(value) {
    if (value === undefined)
      return;

    this.reportFailure('expected undefined, but got ' + this.toString(value));
  }

  // Asserts |value| !== undefined.
  isDefined(value) {
    if (value !== undefined)
      return;

    this.reportFailure('evaluates to undefined');
  }

  // Asserts typeof |value| === "function".
  isFunction(value) {
    if (typeof value === "function")
      return;

    this.reportFailure('expected a function, but got ' + this.toString(value));
  }

  // Asserts typeof |value| !== "function".
  isNotFunction(value) {
    if (typeof value !== "function")
      return;

    this.reportFailure('evaluates to a function');
  }

  // Asserts typeof |value| === "object" && !Array.isArray(|value|).
  isObject(value) {
    if (typeof value === "object" && !Array.isArray(value))
      return;

    this.reportFailure('expected an object, but got ' + this.toString(value));
  }

  // Asserts typeof |value| !== "function".
  isNotObject(value) {
    if (typeof value !== "object" || Array.isArray(value))
      return;

    this.reportFailure('evaluates to an object');
  }

  // Asserts Array.isArray(value).
  isArray(value) {
    if (Array.isArray(value))
      return;

    this.reportFailure('expected an array, but got ' + this.toString(value));
  }

  // !Asserts Array.isArray(value).
  isNotArray(value) {
    if (!Array.isArray(value))
      return;

    this.reportFailure('evaluates to an array');
  }

  // Asserts typeof |value| === "string".
  isString(value) {
    if (typeof value === "string")
      return;

    this.reportFailure('expected a string, but got ' + this.toString(value));
  }

  // Asserts typeof |value| !== "string".
  isNotString(value) {
    if (typeof value !== "string")
      return;

    this.reportFailure('evaluates to a string');
  }

  // Asserts typeof |value| === "number".
  isNumber(value) {
    if (typeof value === "number")
      return;

    this.reportFailure('expected a number, but got ' + this.toString(value));
  }

  // Asserts typeof |value| !== "number".
  isNotNumber(value) {
    if (typeof value !== "number")
      return;

    this.reportFailure('evaluates to a number');
  }

  // Asserts typeof |value| === "boolean".
  isBoolean(value) {
    if (typeof value === "boolean")
      return;

    this.reportFailure('expected a boolean, but got ' + this.toString(value));
  }

  // Asserts typeof |value| !== "boolean".
  isNotBoolean(value) {
    if (typeof value !== "boolean")
      return;

    this.reportFailure('evaluates to a boolean');
  }

  // -----------------------------------------------------------------------------------------------

  // Asserts typeof value === name
  typeOf(value, name) {
    if (typeof value === name)
      return;

    this.reportFailure('expected type ' + this.toString(name) + ', but got ' + this.toString(value));
  }

  // Asserts typeof value !== name
  notTypeOf(value, name) {
    if (typeof value !== name)
      return;

    this.reportFailure('has type ' + this.toString(name));
  }

  // -----------------------------------------------------------------------------------------------

  // Asserts (object instanceof constructor)
  instanceOf(object, constructor) {
    if (object instanceof constructor)
      return;

    this.reportFailure('expected ' + this.toString(name) + ' to be instance of ' + constructor.name);
  }

  // Asserts !(object instanceof constructor)
  notInstanceOf(object, constructor) {
    if (!(object instanceof constructor))
      return;

    this.reportFailure('is instance of ' + constructor.name);
  }

  // -----------------------------------------------------------------------------------------------

  // Asserts that |needle| is in |haystack|.
  include(haystack, needle) {
    if (haystack.includes(needle))
      return;

    this.reportFailure('expected ' + this.toString(needle) + ' to be included');
  }

  // Asserts that |needle| is not in |haystack|.
  notInclude(haystack, needle) {
    if (!haystack.includes(needle))
      return;

    this.reportFailure('expected ' + this.toString(needle) + ' not to be included');
  }

  // -----------------------------------------------------------------------------------------------

  // Asserts that executing |fn| throws an exception of |type|.
  // TODO(Russell): Also allow asserting on the exception's message.
  throws(fn, type) {
    if (typeof fn !== 'function')
      this.reportFailure('|fn| must be a function');

    let threw = true;
    try {
      fn();
      threw = false;
    } catch (e) {
      if (typeof type === 'undefined')
        return;

      if ((typeof type === 'function' && e instanceof type) ||
          (typeof type === 'string' && e.name == type))
        return;

      let textualType = typeof type == 'string' ? type
                                                : this.toString(type);

      this.reportFailure('expected ' + textualType + ' exception, but got ' + e.name);
    }

    if (!threw)
      this.reportFailure('did not throw');
  }

  // Asserts that executing |fn| does not throw an exception.
  doesNotThrow(fn) {
    if (typeof fn !== 'function')
      this.reportFailure('|fn| must be a function');

    try {
      fn();
    } catch (e) {
      this.reportFailure('threw a ' + e.name + ' (' + e.message + ')');
    }
  }

  // -----------------------------------------------------------------------------------------------

  // Asserts Math.abs(actual - expected) <= delta
  closeTo(actual, expected, delta) {
    if (Math.abs(actual - expected) <= delta)
      return;

    this.reportFailure('expected ' + this.toString(actual) + ' to be close (~' + delta + ') to ' + this.toString(expected));
  }

  // Asserts Math.abs(actual - expected) > delta
  notCloseTo(actual, expected, delta) {
    if (Math.abs(actual - expected) > delta)
      return;

    this.reportFailure('expected ' + this.toString(actual) + ' to not be close (~' + delta + ') to ' + this.toString(expected));
  }

  // -----------------------------------------------------------------------------------------------

  // Creates a failure because the current place in the code execution should not be reached.
  notReached() {
    this.reportFailure('the code was unexpectedly reached');
  }

  // -----------------------------------------------------------------------------------------------

  // Creates a failure because of an unexpected promise resolution.
  unexpectedResolution() {
    this.reportFailure('promise was not expected to resolve');
  }

  // Creates a failure because of an unexpected promise rejection.
  unexpectedRejection() {
    this.reportFailure('promise was not expected to reject');
  }

  // -----------------------------------------------------------------------------------------------

  // Asserts that a certain Pawn function has been called, optionally with the given signature and
  // arguments. The last |times| calls will be considered for the assertion.
  pawnCall(fn, { signature = null, args = null, times = 1 } = {}) {
    const calls = MockPawnInvoke.getInstance().calls;
    let count = 0;

    for (const call of calls) {
      if (call.fn != fn)
        continue;  // call to another Pawn method

      if (signature !== null && call.signature != signature)
        continue;  // signature was provided, and differs

      if (args !== null && !angularEquals(call.args, args))
        continue;  // arguments were provided, but differ

      if (++count >= times)
        break;
    }

    if (count < times)
      this.reportFailure('expected ' + times + ' call(s) to ' + fn + ', got ' + count);
  }

  // Asserts that a certain Pawn function has *not* been called, optionally with the given signature
  // and arguments. The last |times| calls will be considered for the assertion.
  noPawnCall(fn, { signature = null, args = null, times = 1 } = {}) {
    let exceptionThrown = false;

    try {
      this.pawnCall(fn, { signature, args, times });
    } catch (e) {
      exceptionThrown = true;
    }

    if (!exceptionThrown)
      this.reportFailure('expected no call(s) to ' + fn);
  }

  // -----------------------------------------------------------------------------------------------

  // Coerces |value| to a string.
  toString(value) {
    if (value === null)
      return 'null';
    else if (value === undefined)
      return 'undefined';
    else if (Number.isNaN(value))
      return 'NaN';

    return value.toString();
  }

  // Reports |failure| by throwing an AssertionFailedError. This method should only be called by
  // methods within this class, tests should use the exposed assertions instead.
  reportFailure(message) {
    throw new AssertionFailedError({ suiteDescription: this.suite_.description,
                                     testDescription: this.description_,
                                     innerError: new Error() },
                                   message);
  }
};

// equals() method taken from Angular:
// https://github.com/angular/angular.js/blob/6c59e770084912d2345e7f83f983092a2d305ae3/src/Angular.js#L670
function angularEquals(o1, o2) {
  if (o1 === o2) return true;
  if (o1 === null || o2 === null) return false;
  if (o1 !== o1 && o2 !== o2) return true; // NaN === NaN
  var t1 = typeof o1, t2 = typeof o2, length, key, keySet;
  if (t1 == t2) {
    if (t1 == 'object') {
      if (Array.isArray(o1)) {
        if (!Array.isArray(o2)) return false;
        if ((length = o1.length) == o2.length) {
          for(key=0; key<length; key++) {
            if (!angularEquals(o1[key], o2[key])) return false;
          }
          return true;
        }
      } else if (toString.apply(o1) == '[object Date]') {
        return toString.apply(o2) == '[object Date]' && o1.getTime() == o2.getTime();
      } else if (toString.apply(o1) == '[object RegExp]' && toString.apply(o2) == '[object RegExp]') {
        return o1.toString() == o2.toString();
      } else {
        if (Array.isArray(o2)) return false;
        keySet = {};
        for(key in o1) {
          if (key.charAt(0) === '$' || typeof o1[key] === 'function') continue;
          if (!angularEquals(o1[key], o2[key])) return false;
          keySet[key] = true;
        }
        for(key in o2) {
          if (!keySet.hasOwnProperty(key) &&
              key.charAt(0) !== '$' &&
              o2[key] !== undefined &&
              !(typeof o2[key] === 'function')) return false;
        }
        return true;
      }
    }
  }
  return false;
}

export default Assert;
