// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Thanks to: https://github.com/karanlyons/murmurHash3.js/blob/master/murmurHash3.js

// Returns the 32-bit result of hashing |input| with the murmur3 algorithm.
export function murmur3hash(input) {
    if (typeof input !== 'string' || !input.length)
        throw new Error('The |input| must be a non-empty string.');

    return generateHash(input);
}

// Generate our murmur3-hash based on given |key| according to the algorithm
function generateHash(key) {
    const remainder = key.length % 4;
    const bytes = key.length - remainder;

    let h1 = 0; // seed

    let k1 = 0;

    const c1 = 0xcc9e2d51;
    const c2 = 0x1b873593;

    let i;
    for (i = 0; i < bytes; i = i + 4) {
        k1 = ((key.charCodeAt(i) & 0xff)) | ((key.charCodeAt(i + 1) & 0xff) << 8) | ((key.charCodeAt(i + 2) & 0xff) << 16) | ((key.charCodeAt(i + 3) & 0xff) << 24);

        k1 = x86Multiply(k1, c1);
        k1 = x86Rotl(k1, 15);
        k1 = x86Multiply(k1, c2);

        h1 ^= k1;
        h1 = x86Rotl(h1, 13);
        h1 = x86Multiply(h1, 5) + 0xe6546b64;
    }

    k1 = 0;

    switch (remainder) {
        case 3:
            k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;

        case 2:
            k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;

        case 1:
            k1 ^= (key.charCodeAt(i) & 0xff);
            k1 = x86Multiply(k1, c1);
            k1 = x86Rotl(k1, 15);
            k1 = x86Multiply(k1, c2);
            h1 ^= k1;
    }

    h1 ^= key.length;
    h1 = x86Fmix(h1);

    return h1 >>> 0;
}

// Multiplies two 32bit integers and returns it as a 32bit integer
function x86Multiply(firstInteger, secondInteger) {
    return ((firstInteger & 0xffff) * secondInteger) + ((((firstInteger >>> 16) * secondInteger) & 0xffff) << 16);
}

// Rotates the given integer by the given number of bit positions
function x86Rotl(integer, numberOfBitPositions) {
    return (integer << numberOfBitPositions) | (integer >>> (32 - numberOfBitPositions));
}

// Final mix of the block and gives the murmur3-hash of it
function x86Fmix(block) {
    block ^= block >>> 16;
    block  = x86Multiply(block, 0x85ebca6b);
    block ^= block >>> 13;
    block  = x86Multiply(block, 0xc2b2ae35);
    block ^= block >>> 16;

    return block;
}
