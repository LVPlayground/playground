// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const MurmurHash3 = require('features/activity_log/murmurhash3.js');

describe('MurmurHash3', (it) => {
    it('generateHash should throw an error when key is empty', assert => {
        assert.throws(() => MurmurHash3.generateHash(''));
    });

    it('generateHash should throw an error when key is null', assert => {
        assert.throws(() => MurmurHash3.generateHash(null));
    });

    it('should throw a typeerror when x86Multiply_ is directly called', assert => {
        const symbol = Symbol('x86Multiply');

        assert.throws(() => MurmurHash3.x86Multiply_(symbol, 8, 6));
    });

    it('should throw a typeerror when x86Rotl_ is directly called', assert => {
        const symbol = Symbol('x86Rotl');

        assert.throws(() => MurmurHash3.x86Rotl_(symbol, 8, 6));
    });

    it('should throw a typeerror when x86Fmix_ is directly called', assert => {
        const symbol = Symbol('x86Fmix');

        assert.throws(() => MurmurHash3.x86Fmix_(symbol, 'x86Fmix'));
    });

    it('should generate a correct Murmur3-hash of the word \'test\'', assert => {
        const generatedHashOfTest = MurmurHash3.generateHash('test');
        const expectedHashOfTest = '3127628307'; // according to http://murmurhash.shorelabs.com/
                                                 // use 2nd field: x86 - 32 bit

        assert.equal(generatedHashOfTest, expectedHashOfTest)
    });
});
