// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * This class contains various methods, both self-implemented as SA-MP natives,
 * which may aid in doing frequent calculations within the gamemode.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class Math {
    /**
     * Round the given value to the closest number. Values with .5 or
     * higher will be rounded to a higher number, whereas values with
     * .49 or less will be rounded to a lesser number.
     *
     * @param value The value which has to be rounded.
     * @return integer The closest round number to the value.
     */
    public inline round(Float: value) {
        return (floatround(value, floatround_round));
    }

    /**
     * Floor a float value downwards to a round number.
     *
     * @param value The value which has to be floored.
     * @return integer The closest lesser round number based on the value.
     */
    public inline floor(Float: value) {
        return (floatround(value, floatround_floor));
    }

    /**
     * Generating a random value may be done through this method, which accepts
     * two parameters defining the boundaries of the generated random number.
     *
     * @param minimum The minimum value the pseudo-random number should be.
     * @param maximum The maximum value the pseudo-random number should be.
     * @return integer The calculated pseudo-random number in the given range.
     */
    public inline random(minimum, maximum) {
        return (minimum + random(maximum - minimum));
    }
};
