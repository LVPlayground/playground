// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Assert from 'base/test/assert.js';
import AssertionFailedError from 'base/test/assertion_failed_error.js';

describe('Assert', it => {
  // TODO: assert(expression, message)
  // TODO: assert.fail(actual, expected, [message], [operator])

  it('ok', assert => {
    assert.ok(true);
    assert.ok(42);
    assert.ok([1]);
  });

  it('notOk', assert => {
    assert.notOk(false);
    assert.notOk(undefined);
    assert.notOk(null);
    assert.notOk(!42);
  });

  it('equal', assert => {
    let fn = () => 0;

    assert.equal(null, null);
    assert.equal(undefined, undefined);
    assert.equal(0, -0);
    assert.equal(42, 42);
    assert.equal(42, "42");
    assert.equal("lvp", "lvp");
    assert.equal(fn, fn);
  });

  it('notEqual', assert => {
    assert.notEqual(100, -100);
    assert.notEqual("lvp", "samp");
    assert.notEqual(true, false);
    assert.notEqual([1, 2, 3], [1, 2, 3]);
    assert.notEqual({ a: true }, { a: true });
  });

  it('strictEqual', assert => {
    let fn = () => 0;

    assert.strictEqual(0, -0);
    assert.strictEqual(100, 100);
    assert.strictEqual("lvp", "lvp");
    assert.strictEqual(fn, fn);
  });

  it('notStrictEqual', assert => {
    assert.notStrictEqual(42, "42");
  });

  it('deepEqual', assert => {
    assert.deepEqual([1, 2, 3], [1, 2, 3]);
    assert.deepEqual({ foo: 'bar' }, { foo: 'bar' });
    assert.deepEqual([ { bar: 'foo' } ], [ { bar: 'foo' } ]);
    assert.deepEqual(Assert.prototype, Assert.prototype);
    assert.deepEqual(assert, assert);
  });

  it('notDeepEqual', assert => {
    assert.notDeepEqual([1, 2, 3], [1, 2, 3, 4]);
    assert.notDeepEqual({ foo: 'bar' }, { bar: 'foo' });
    assert.notDeepEqual({ foo: 'bar' }, { foo: 'bar', bar: 'baz' });
  });

  it('isTrue', assert => {
    assert.isTrue(true);
    assert.isTrue(1);
    assert.isTrue([]);
    assert.isTrue({});
  });

  it('includes', assert => {
    assert.includes([1, 2, 3], 2);
    assert.includes('hello, world!', 'hell');
    assert.includes('hello, world', 'o, w');
  });

  it('doesNotInclude', assert => {
    assert.doesNotInclude([1, 2, 3], 4);
    assert.doesNotInclude('hello, world', 'HELLO');
    assert.doesNotInclude('Hello', 'Joe');
  });

  it('isAbove', assert => {
    assert.isAbove(42, 40);
    assert.isAbove(-10, -20);
    assert.isAbove("b", "a");
    assert.isAbove([1], [0]);
  });

  it('isAboveOrEqual', assert => {
    assert.isAboveOrEqual(42, 40);
    assert.isAboveOrEqual(42, 42);
    assert.isAboveOrEqual("b", "a");
    assert.isAboveOrEqual("b", "b");
    assert.isAboveOrEqual([1], [0]);
    assert.isAboveOrEqual([1], [1]);
  });

  it('isBelow', assert => {
    assert.isBelow(40, 42);
    assert.isBelow(-20, -10);
    assert.isBelow("a", "b");
    assert.isBelow([0], [1]);
  });

  it('isBelowOrEqual', assert => {
    assert.isBelowOrEqual(40, 42);
    assert.isBelowOrEqual(42, 42);
    assert.isBelowOrEqual("a", "b");
    assert.isBelowOrEqual("b", "b");
    assert.isBelowOrEqual([0], [1]);
    assert.isBelowOrEqual([1], [1]);
  });

  it('isFalse', assert => {
    assert.isFalse(false);
    assert.isFalse(0);
    assert.isFalse(null);
    assert.isFalse(undefined);
  });

  it('isNull', assert => {
    assert.isNull(null);
  });

  it('isNotNull', assert => {
    assert.isNotNull(undefined);
    assert.isNotNull(false);
    assert.isNotNull({});
  });

  it('isUndefined', assert => {
    assert.isUndefined(undefined);
    assert.isUndefined();
  });

  it('isDefined', assert => {
    assert.isDefined(null);
    assert.isDefined(false);
    assert.isDefined({});
  });

  it('isFunction', assert => {
    function fn() {}

    assert.isFunction(() => 0);
    assert.isFunction(assert.isFunction);
    assert.isFunction(fn);
    assert.isFunction(class Foo {});
  });

  it('isNotFunction', assert => {
    assert.isNotFunction(null);
    assert.isNotFunction(undefined);
    assert.isNotFunction("lvp");
  });

  it('isObject', assert => {
    assert.isObject({ a: 'foo' });
    assert.isObject(Assert.prototype);
  });

  it('isNotObject', assert => {
    assert.isNotObject("lvp");
    assert.isNotObject([1, 2, 3]);
    assert.isNotObject(false);
  });

  it('isArray', assert => {
    assert.isArray(Array.prototype);
    assert.isArray([1, 2, 3]);
  });

  it('isNotArray', assert => {
    assert.isNotArray("lvp");
    assert.isNotArray({ [Symbol.iterator]() { return 1; }});
    assert.isNotArray(true);
  });

  it('isString', assert => {
    assert.isString("lvp");
    assert.isString("lvp".toString());
  });

  it('isNotString', assert => {
    assert.isNotString(true);
    assert.isNotString([ 'l', 'v', 'p']);
  });

  it('isNumber', assert => {
    assert.isNumber(42);
    assert.isNumber(42.24);
    assert.isNumber(-1337);
  });

  it('isNotNumber', assert => {
    assert.isNotNumber(!!0);
    assert.isNotNumber(Math.NaN);
    assert.isNotNumber("42");
  });

  it('isBoolean', assert => {
    assert.isBoolean(true);
    assert.isBoolean(!!"lvp");
    assert.isBoolean(!!"0");
    assert.isBoolean(true !== false);
  });

  it('isNotBoolean', assert => {
    assert.isNotBoolean("true");
    assert.isNotBoolean({ true: 1 });
    assert.isNotBoolean("1");
  });

  it('typeOf', assert => {
    assert.typeOf(1, 'number');
    assert.typeOf(() => 0, 'function');
    assert.typeOf(false, 'boolean');
    assert.typeOf({}, 'object');
    assert.typeOf([], 'object');
  });

  it('notTypeOf', assert => {
    assert.notTypeOf(1, 'boolean');
    assert.notTypeOf([], 'array');
    assert.notTypeOf(() => 0, 'object');
    assert.notTypeOf(class Foo {}, 'class');
  });

  it('instanceOf', assert => {
    class Foo {};
    class Bar extends Foo {};

    assert.instanceOf(new Foo(), Foo);
    assert.instanceOf(new Bar(), Foo);
    assert.instanceOf(new Bar(), Bar);
  });

  it('notInstanceOf', assert => {
    class Foo {};
    class Bar {};

    assert.notInstanceOf(new Foo(), Bar);
    assert.notInstanceOf(new Bar(), Foo);
    assert.notInstanceOf({}, Foo);
    assert.notInstanceOf(Object.create(Bar), Bar);
  });

  // TODO: assert.match(value, regexp, [message])
  // TODO: assert.notMatch(value, regexp, [message])
  // TODO: assert.property(object, property, [message])
  // TODO: assert.notProperty(object, property, [message])
  // TODO: assert.deepProperty(object, property, [message])
  // TODO: assert.notDeepProperty(object, property, [message])
  // TODO: assert.propertyVal(object, property, value, [message])
  // TODO: assert.propertyNotVal(object, property, value, [message])
  // TODO: assert.deepPropertyVal(object, property, value, [message])
  // TODO: assert.deepPropertyNotVal(object, property, value, [message])
  // TODO: assert.lengthOf(object, length, [message])

  it('throws', assert => {
    assert.throws(() => { throw new Error }, 'Error');
    assert.throws(() => { throw new Error }, Error);
    assert.throws(() => { assert.throws(() => { /* no exception */ }, 'TypeError') }, 'AssertionFailedError');
    assert.throws(() => { assert.throws(() => { throw new Error }, 'WrongError') }, 'AssertionFailedError');
  });

  it('doesNotThrow', assert => {
    assert.doesNotThrow(() => {});
    assert.doesNotThrow(() => {
      try { throw new Error }
      catch (e) { }
    });
  });

  it('pawnCall', assert => {
    pawnInvoke('MyFunction', 'i', 42);

    assert.pawnCall('MyFunction');
    assert.pawnCall('MyFunction', { signature: 'i' });
    assert.pawnCall('MyFunction', { signature: 'i', args: [ 42 ] });
    assert.pawnCall('MyFunction', { args: [ 42 ]});
    assert.pawnCall('MyFunction', { times: 1 });

    assert.throws(() => assert.pawnCall('MyFunction', { signature: 's' }));
    assert.throws(() => assert.pawnCall('MyFunction', { args: [ 1337 ] }));
    assert.throws(() => assert.pawnCall('MyFunction', { times: 2 }));

    pawnInvoke('MySecondFunction', 's', 'hello');
    pawnInvoke('MySecondFunction', 's', 'hello');
    pawnInvoke('MySecondFunction', 's', 'world');

    assert.pawnCall('MySecondFunction');
    assert.pawnCall('MySecondFunction', { signature: 's', args: [ 'hello' ] });
    assert.pawnCall('MySecondFunction', { signature: 's', args: [ 'world' ] });
    assert.pawnCall('MySecondFunction', { times: 3 });
    assert.pawnCall('MySecondFunction', { signature: 's', times: 3 });
    assert.pawnCall('MySecondFunction', { args: [ 'hello' ], times: 2 });

    assert.throws(() => assert.pawnCall('MySecondFunction', { args: [ 'hello' ], times: 3 }));
  });

  // TODO: assert.operator(val1, operator, val2, [message])

  it('closeTo', assert => {
    assert.closeTo(5, 10, 20);
    assert.closeTo(42, 40, 10000);
    assert.closeTo(42, 42, 1);
    assert.closeTo(42, 42, 0);
    assert.closeTo(12.50, 12.75, 0.50);
  });

  // TODO: assert.sameMembers(set1, set2, [message])
  // TODO: assert.sameDeepMembers(set1, set2, [message])
  // TODO: assert.includeMembers(superset, subset, [message])
  // TODO: assert.changes(function, object, property)
  // TODO: assert.doesNotChange(function, object, property)
  // TODO: assert.increases(function, object, property)
  // TODO: assert.doesNotIncrease(function, object, property)
  // TODO: assert.decreases(function, object, property)
  // TODO: assert.doesNotDecrease(function, object, property)

  it('can stringify types', assert => {
    assert.strictEqual('42', assert.toString(42));
    assert.strictEqual('-42', assert.toString(-42));
    assert.strictEqual('null', assert.toString(null));
    assert.strictEqual('NaN', assert.toString(Number.NaN));
    assert.strictEqual('undefined', assert.toString(undefined));
  });

  it('is able to provide context with an exception', assert => {
    assert.setContext('gunther');

    try {
      assert.isTrue(false);
    } catch (exception) {
      assert.includes(exception.message, ' [context: gunther]');
    }
  });
});
