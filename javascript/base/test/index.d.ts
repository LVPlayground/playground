// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

declare module 'base/test/assert.js' {
    export default class Assert {
        constructor(suite: any, description: string);

        ok(object);
        notOk(object);
        equal(actual, expected);
        notEqual(actual, expected)
        strictEqual(actual, expected);
        notStrictEqual(actual, expected);
        deepEqual(actual, expected);
        notDeepEqual(actual, expected);
        isTrue(value);
        includes(haystack, needle);
        doesNotInclude(haystack, needle);
        isAbove(valueToCheck, valueToBeAbove);
        isAboveOrEqual(valueToCheck, valueToBeAboveOrEqual);
        isBelow(valueToCheck, valueToBeBelow);
        isBelowOrEqual(valueToCheck, valueToBeBelowOrEqual);
        isFalse(value);
        isNull(value);
        isNotNull(value);
        isUndefined(value);
        isDefined(value);
        isDefined(value);
        isFunction(value);
        isNotFunction(value);
        isObject(value);
        isNotObject(value);
        isArray(value);
        isNotArray(value);
        isString(value);
        isNotString(value);
        isNumber(value);
        isNotNumber(value);
        isBoolean(value);
        isNotBoolean(value);
        typeOf(value, name);
        notTypeOf(value, name);
        instanceOf(object, constructor);
        notInstanceOf(object, constructor);
        throws(fn, type?);
        doesNotThrow(fn);
        closeTo(actual, expected, delta);
        notCloseTo(actual, expected, delta);
        notReached();
        unexpectedResolution();
        unexpectedRejection();
        pawnCall(...parameters);
        noPawnCall(...parameters);

        toString(value);
        reportFailure(message);
    }
}
