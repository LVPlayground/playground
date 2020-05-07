// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { isSafeInteger, toSafeInteger } from 'base/string_util.js';

describe('StringUtil', it => {
    it('should be able to identify and convert integral values', assert => {
        assert.isTrue(isSafeInteger('-1000'));
        assert.isTrue(isSafeInteger('1000'));
        assert.isTrue(isSafeInteger('0'));
        assert.isTrue(isSafeInteger('-0'));
        assert.isTrue(isSafeInteger('+0'));
        assert.isTrue(isSafeInteger('5e5'));

        assert.isFalse(isSafeInteger('-10.25'));
        assert.isFalse(isSafeInteger('10.25'));
        assert.isFalse(isSafeInteger('.1'));
        assert.isFalse(isSafeInteger('7.551e2'));

        assert.isFalse(isSafeInteger('cheese'));
        assert.isFalse(isSafeInteger(''));

        assert.strictEqual(toSafeInteger('-1000'), -1000);
        assert.strictEqual(toSafeInteger('1000'), 1000);
        assert.strictEqual(toSafeInteger('0'), 0);
        assert.strictEqual(toSafeInteger('-0'), -0);
        assert.strictEqual(toSafeInteger('+0'), +0);
        assert.strictEqual(toSafeInteger('5e5'), 500000);
    });
});
