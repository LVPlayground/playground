// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let Extendable = require('base/extendable.js');

class ExtendableUser extends Extendable {
  constructor() {
    super();

    this.value_ = 12;
  }

  get value() { return this.value_; }

  someMethod() {}
};

class ExtendableSubUser extends ExtendableUser {
  constructor() {
    super();

    this.value_ = 24;
  }

  someOtherMethod() {}
};

describe('Extendable', (it, beforeEach, afterEach) => {
  // Clear the Extendable state for each of the test classes after the tests. This will make sure
  // that we clean up after ourselves even if some of the tests fail.
  afterEach(() => {
    ExtendableUser.clearExtendablesForTests();
    ExtendableSubUser.clearExtendablesForTests();
  });

  it('validates whether a property can be provided', assert => {
    // Defining the same property twice.
    assert.throws(() => {
      ExtendableUser.provideProperty('myProperty', () => false);
      ExtendableUser.provideProperty('myProperty', () => false);
    });

    // Using non-function arguments for either the getter or setter.
    assert.throws(() => {
      ExtendableUser.provideProperty('myOtherProperty', 42);
    });

    assert.throws(() => {
      ExtendableUser.provideProperty('myOtherProperty', () => false, 42);
    })
  });

  it('is able to provide properties', assert => {
    ExtendableUser.provideProperty('double', instance => instance.value_ * 2);
    ExtendableSubUser.provideProperty('triple', instance => instance.value_ * 3);

    let extendableUser = new ExtendableUser(),
        extendableSubUser = new ExtendableSubUser();

    assert.equal(extendableUser.value, 12);
    assert.equal(extendableSubUser.value, 24);

    assert.isTrue(extendableUser.hasOwnProperty('double'));
    assert.equal(extendableUser.double, 24);

    assert.isTrue(extendableSubUser.hasOwnProperty('double'));
    assert.equal(extendableSubUser.double, 48);

    assert.isFalse(extendableUser.hasOwnProperty('triple'));
    assert.isUndefined(extendableUser.triple);

    assert.isTrue(extendableSubUser.hasOwnProperty('triple'));
    assert.equal(extendableSubUser.triple, 72);
  });

  it('validates whether a method can be provided', assert => {
    assert.throws(() => {
      // Does not yet exist on the prototype.
      ExtendableUser.provideMethod('someOtherMethod', () => false);

      // Already exists on the prototype.
      ExtendableUser.provideMethod('someMethod', () => false);
    });

    assert.throws(() => {
      // Already exists on the parent class' prototype.
      ExtendableSubUser.provideMethod('someMethod', () => false);
    });

    assert.throws(() => {
      // The extendable already exists.
      ExtendableUser.provideMethod('anotherMethod', () => false);
      ExtendableUser.provideMethod('anotherMethod', () => false);
    })

    assert.throws(() => {
      // The handler must be a function.
      ExtendableUser.provideMethod('anotherMethod', 42);
    });
  });

  it('is able to provide methods', assert => {
    ExtendableUser.provideMethod('multiply', (instance, multiplier) => instance.value_ * multiplier);
    ExtendableSubUser.provideMethod('divide', (instance, divisor) => instance.value_ / divisor);

    let extendableUser = new ExtendableUser(),
        extendableSubUser = new ExtendableSubUser();

    assert.equal(extendableUser.value, 12);
    assert.equal(extendableSubUser.value, 24);

    assert.isTrue(extendableUser.__proto__.hasOwnProperty('multiply'));
    assert.isTrue(extendableSubUser.__proto__.__proto__.hasOwnProperty('multiply'));

    assert.isFalse(extendableUser.__proto__.hasOwnProperty('divide'));
    assert.isTrue(extendableSubUser.__proto__.hasOwnProperty('divide'));

    assert.equal(extendableUser.multiply(3), 36);
    assert.equal(extendableSubUser.multiply(3), 72);

    assert.throws(() => extendableUser.divide(2));

    assert.equal(extendableSubUser.divide(2), 12);
  });
});
