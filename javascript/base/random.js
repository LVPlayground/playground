// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Creates a global random seed based on which the seed-less |random| function will function.
let globalSeed = null;

// Returns a random number between [min, max]. For consistency with Pawn, if the |max| argument is
// omitted then the |min| will be used at the maximum instead, returning a number between [0, max].
export function random(min, max = null) {
    if (!globalSeed)
        globalSeed = UltraHighEntropyPseudoRandomNumberGenerator.createRandom();

    return randomSeed(globalSeed, min, max);
}

// Returns a random number between [min, max], with the given |seed|. For consistency with Pawn, if
// the |max| argument is omitted then the |min| will be used at the maximum instead, returning a
// number between [0, max]. The seed only has to be used when generating deterministic values.
export function randomSeed(seed, min, max = null) {
    if (max === null) {
        if (min <= 0)
            throw new Error(`The boundary passed to random(max) may not be negative.`);

        max = min;
        min = 0;
    }

    return Math.floor(seed.random() * (max - min)) + min;
}

// Initial state of the hashing function that's used for the PRNG.
const kInitialMashState = 0xEFC8249D;

// Number of entropy-holding 32-bit values to use for the generator.
const kOrderValue = 48;

// Implementation of the UHE PRNG algorithm created by the Gibson Research Corporation, which is a
// stronger PRNG than the one included in most JavaScript engines, and is able to work based on a
// seed as well as true randomness. https://www.grc.com/otg/uheprng.htm
class UltraHighEntropyPseudoRandomNumberGenerator {
    // Creates a new instance based on random number generation. No seed will be used, instead, 48
    // random values will be provided as the seeded base.
    static createRandom() { return new UltraHighEntropyPseudoRandomNumberGenerator(); }

    // Creates a new instance based on the given |seed|, which will be hashed to generate the seeded
    // base using which numbers will be generated.
    static createSeeded(seed) { return new UltraHighEntropyPseudoRandomNumberGenerator(seed); }

    // ---------------------------------------------------------------------------------------------

    carry_ = null;
    phase_ = null;
    state_ = null;

    mashState_ = null;

    constructor(seed = null) {
        this.carry_ = 1;
        this.phase_ = kOrderValue;
        this.state_ = new Array(kOrderValue);

        this.mashState_ = kInitialMashState;

        if (seed)
            throw new Error('Seeded PRNG has not been implemented yet.');
        else
            this.initializeRandom();
    }

    // Initializes this instance with random data for seedless behaviour.
    initializeRandom() {
        for (let index = 0; index < kOrderValue; ++index)
            this.state_[index] = this.mash(Math.random());
    }

    // ---------------------------------------------------------------------------------------------

    // Returns a random float between 0 (inclusive) and 1 (exclusive)
    random() { return this.prng() + (this.prng() * 0x200000 | 0) * 1.1102230246251565e-16; }

    // ---------------------------------------------------------------------------------------------

    // Based on Johannes Baagoe's hash function, which has an "avalance" effect meaning that every
    // bit of the input affects every bit of the output 50% of the time.
    mash(value) {
        const valueString = value.toString();
        for (let index = 0; index < valueString.length; ++index) {
            this.mashState_ += valueString.charCodeAt(index);

            let hash = 0.02519603282416938 * this.mashState_;

            this.mashState_ = hash >>> 0;
            hash -= this.mashState_;
            hash *= this.mashState_;
            this.mashState_ = hash >>> 0;
            hash -= this.mashState_;
            this.mashState_ += hash * 0x100000000; // 2^32
        }

        return (this.mashState_ >>> 0) * 2.3283064365386963e-10; // 2^-32
    }

    // Implementation of the actual raw pseudo-random-number generator, which is a multiply-with-
    // carry algorithm based on the internal state and phase.
    prng() {
        this.phase_++;
        if (this.phase_ >= kOrderValue)
            this.phase_ = 0;
        
        const tally = 1768863 * this.state_[this.phase_] + this.carry_ * 2.3283064365386963e-10;
        return this.state_[this.phase_] = tally - (this.carry_ = tally | 0);
    }
}
