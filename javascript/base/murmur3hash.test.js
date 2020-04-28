// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { murmur3hash } from 'base/murmur3hash.js';

describe('murmur3hash', it => {
    it('should reject invalid input', assert => {
        assert.throws(() => murmur3hash(''));
        assert.throws(() => murmur3hash(null));
        assert.throws(() => murmur3hash(3.14));
        assert.throws(() => murmur3hash());
    });

    it('should match reference values of the hash32 output', assert => {
        // Values created using http://murmurhash.shorelabs.com/
        assert.equal(murmur3hash('test'), 3127628307)
        assert.equal(murmur3hash('TEST'), 1133853452);
        assert.equal(murmur3hash('LVP'), 1922530314);
        assert.equal(murmur3hash('Las Venturas Playground'), 2285784705);
        assert.equal(murmur3hash('@#$U@#$HDFS'), 806657796);
        assert.equal(murmur3hash('\'\'\''), 1103059314);
    });
});
