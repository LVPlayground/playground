// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('StringUtil', it => {
    it('should be able to identify and convert integral values', assert => {
        assert.isTrue('-1000'.isSafeInteger());
        assert.isTrue('1000'.isSafeInteger());
        assert.isTrue('0'.isSafeInteger());
        assert.isTrue('-0'.isSafeInteger());
        assert.isTrue('+0'.isSafeInteger());
        assert.isTrue('5e5'.isSafeInteger());

        assert.isFalse('-10.25'.isSafeInteger());
        assert.isFalse('10.25'.isSafeInteger());
        assert.isFalse('.1'.isSafeInteger());
        assert.isFalse('7.551e2'.isSafeInteger());

        assert.isFalse('cheese'.isSafeInteger());
        assert.isFalse(''.isSafeInteger());

        assert.strictEqual('-1000'.toSafeInteger(), -1000);
        assert.strictEqual('1000'.toSafeInteger(), 1000);
        assert.strictEqual('0'.toSafeInteger(), 0);
        assert.strictEqual('-0'.toSafeInteger(), -0);
        assert.strictEqual('+0'.toSafeInteger(), +0);
        assert.strictEqual('5e5'.toSafeInteger(), 500000);
    });

    it('should be able to identify and convert number values', assert => {
        assert.isTrue('-1000'.isNumber());
        assert.isTrue('1000'.isNumber());
        assert.isTrue('0'.isNumber());
        assert.isTrue('-0'.isNumber());
        assert.isTrue('+0'.isNumber());
        assert.isTrue('5e5'.isNumber());

        assert.isTrue('-10.25'.isNumber());
        assert.isTrue('10.25'.isNumber());
        assert.isTrue('.1'.isNumber());
        assert.isTrue('7.551e2'.isNumber());

        assert.isFalse('cheese'.isNumber());
        assert.isFalse(''.isNumber());

        assert.strictEqual('-1000'.toNumber(), -1000);
        assert.strictEqual('1000'.toNumber(), 1000);
        assert.strictEqual('0'.toNumber(), 0);
        assert.strictEqual('-0'.toNumber(), -0);
        assert.strictEqual('+0'.toNumber(), +0);
        assert.strictEqual('5e5'.toNumber(), 500000);
        assert.strictEqual('-10.25'.toNumber(), -10.25);
        assert.strictEqual('10.25'.toNumber(), 10.25);
        assert.strictEqual('.1'.toNumber(), .1);
        assert.strictEqual('7.551e2'.toNumber(), 755.1);
    });
});
