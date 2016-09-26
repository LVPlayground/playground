// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Thanks to: https://github.com/karanlyons/murmurHash3.js/blob/master/murmurHash3.js

// TODO: Look for a correct place for this file

// Private symbol ensuring that only the constructor is used.
const PrivateSymbol = Symbol('Private method, only Murmur3Hash.generateHash should be used.');

// Calling generateHash of this class with a given key and seed returns a decimal, unsigned int,
// hash based on murmur3
class Murmur3Hash {
    // Generate our murmur3-hash based on given |key| according to the algorithm
    static generateHash(key) {
        if (key.trim().length < 1 || key == null)
            throw new Error('key should not be null or empty.');

        const remainder = key.length % 4;
        const bytes = key.length - remainder;

        let h1 = 0; // seed

        let k1 = 0;

        const c1 = 0xcc9e2d51;
        const c2 = 0x1b873593;

        let i;
        for (i = 0; i < bytes; i = i + 4) {
            k1 = ((key.charCodeAt(i) & 0xff)) | ((key.charCodeAt(i + 1) & 0xff) << 8) | ((key.charCodeAt(i + 2) & 0xff) << 16) | ((key.charCodeAt(i + 3) & 0xff) << 24);

            k1 = this.x86Multiply_(PrivateSymbol, k1, c1);
            k1 = this.x86Rotl_(PrivateSymbol, k1, 15);
            k1 = this.x86Multiply_(PrivateSymbol, k1, c2);

            h1 ^= k1;
            h1 = this.x86Rotl_(PrivateSymbol, h1, 13);
            h1 = this.x86Multiply_(PrivateSymbol, h1, 5) + 0xe6546b64;
        }

        k1 = 0;

        switch (remainder) {
            case 3:
                k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;

            case 2:
                k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;

            case 1:
                k1 ^= (key.charCodeAt(i) & 0xff);
                k1 = this.x86Multiply_(PrivateSymbol, k1, c1);
                k1 = this.x86Rotl_(PrivateSymbol, k1, 15);
                k1 = this.x86Multiply_(PrivateSymbol, k1, c2);
                h1 ^= k1;
        }

        h1 ^= key.length;
        h1 = this.x86Fmix_(PrivateSymbol, h1);

        return h1 >>> 0;
    }

    // Multiplies two 32bit integers and returns it as a 32bit integer
    static x86Multiply_(privateSymbol, firstInteger, secondInteger) {
        if (privateSymbol !== PrivateSymbol)
            throw new TypeError('Private method, only Murmur3Hash.generateHash should be used.');

        return ((firstInteger & 0xffff) * secondInteger) + ((((firstInteger >>> 16) * secondInteger) & 0xffff) << 16);
    }

    // Rotates the given integer by the given number of bit positions
    static x86Rotl_(privateSymbol, integer, numberOfBitPositions) {
        if (privateSymbol !== PrivateSymbol)
            throw new TypeError('Private method, only Murmur3Hash.generateHash should be used.');

        return (integer << numberOfBitPositions) | (integer >>> (32 - numberOfBitPositions));
    }

    // Final mix of the block and gives the murmur3-hash of it
    static x86Fmix_(privateSymbol, block) {
        if (privateSymbol !== PrivateSymbol)
            throw new TypeError('Private method, only Murmur3Hash.generateHash should be used.');

        block ^= block >>> 16;
        block  = this.x86Multiply_(privateSymbol, block, 0x85ebca6b);
        block ^= block >>> 13;
        block  = this.x86Multiply_(privateSymbol, block, 0xc2b2ae35);
        block ^= block >>> 16;

        return block;
    }

    static provideNativeMurmur3HashGenerateHashToPawn() {
        provideNative('MurmurIIIHashGenerateHash', 'siS', (key, maxLength) => {
            let result = '0';

            try {
                result = Murmur3Hash.generateHash(key).toString();
            } catch (e) {
                console.log('Unable to compute the murmur3 hash for ' + key, e);
            }

            return [result];
        });
    }
}

exports = Murmur3Hash;
