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
     * Define a safe maximum number to match floats against, which is useful
     * in various float-based minimum-distance calculations.
     *
     * @var float
     */
    public const FLOAT_MAX = 9999999999.0;

    /**
     * Calculate the sine of an angle by has /value/ radians.
     *
     * @param value The angle to calculate the sine on.
     * @return Float The calculated sign of the given angle.
     */
    public inline Float: sin(Float: value) {
        return (floatsin(value, radian));
    }

    /**
     * The arc sine is an inverse trigonometric function which defines the
     * inverse of a normal sinus. The value will be expressed in radians.
     *
     * @param value The input sinus which you want to invert.
     * @return Float The computed arc sine, in radians.
     */
    public inline Float: asin(Float: value) {
        return (asin(value));
    }

    /**
     * Calculate the cosine of an angle by has /value/ radians.
     *
     * @param value The value to calculate the cosine on.
     * @return Float The calculated cosine of the given angle.
     */
    public inline Float: cos(Float: value) {
        return (floatcos(value, radian));
    }

    /**
     * An inverse trigonometric function which will return the inverse value
     * of the given cosine in the first parameter.
     *
     * @param value The cosine which you want to know the invert of.
     * @return Float The computed arc cosine, in radians.
     */
    public inline Float: acos(Float: value) {
        return (acos(value));
    }

    /**
     * Calculate the tangent of an angle by has /value/ radians.
     *
     * @param value The angle to calculate the tangent on.
     * @return Float The calculated tangent based on the angle.
     */
    public inline Float: tan(Float: value) {
        return (floattan(value, radian));
    }

    /**
     * The inverse trigonometric function which will return the inverse of a
     * normal tangent. Use atan2 if you need to know the tangent's quadrant.
     *
     * @param value Input tangent you want to know the inverse of.
     * @return Float The computed arc tangent, in radians.
     */
    public inline Float: atan(Float: value) {
        return (atan(value));
    }

    /**
     * In principal the same as atan, with the exception that this method will
     * also take the quadrant of the tangent into account.
     *
     * @param x The x-coordinate to base the inverse tangent on.
     * @param y The y-coordinate to base the inverse tangent on.
     * @return Float  The computed arc tangent, in radians.
     */
    public inline Float: atan2(Float: x, Float: y) {
        return (atan2(x, y));
    }

    /**
     * Calculate the square-root of the given value.
     *
     * @param value The value you want to know the square root of.
     * @return Float The calculated square root.
     */
    public inline Float: sqrt(Float: value) {
        return (floatsqroot(value));
    }

    /**
     * Calculate the power of the given value to the given exponent. For
     * power of two as the exponent it may be cheaper to do a bit-shift.
     *
     * @param value The base number of which you want to know the power.
     * @param exponent To which extent must the power be calculated?
     * @return The calculated power based on the input variables.
     */
    public inline Float: pow(Float: value, Float: exponent) {
        return (floatpower(value, exponent));
    }

    /**
     * This method returns the logarithm based on a base of ten.
     *
     * @param value The value to calculate the logarithm for.
     * @return The natural logarithm of the given value.
     */
    public inline Float: log(Float: value) {
        return (floatlog(value, 10.0));
    }

    /**
     * Return the absolute value of the given value.
     *
     * @param value The value you want to know the absolute value of.
     * @return Float The absoluted value of the given float.
     */
    public inline Float: abs(Float: value) {
        return (floatabs(value));
    }

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
     * Find the ceiling of the given value.
     *
     * @param value The value which has to be rounded.
     * @return integer The closest higher round number to the value.
     */
    public inline ceil(Float: value) {
        return (floatround(value, floatround_ceil));
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

    /**
     * A float version of the pseudo-random number generator which will also take
     * decimals into account. Only the first two levels of decimals will be
     * considered by this method, the rest will be discarded (e.g. rounded).
     *
     * @param minimum The minimum value of the generated pseudo-random number.
     * @param maximum The maximum value of the generated pseudo-random number.
     * @return Float The calculated pseudo-random number in the given range.
     */
    public inline Float: frandom(Float: minimum, Float: maximum) {
        return (floatdiv(floatround(minimum * 100.0) + random(floatround((maximum - minimum) * 100.0)), 100.0));
    }

    /**
     * Retrieve the smallest of the two given float arguments.
     *
     * @param left The first value which should be checked for its value.
     * @param right The second value which should be checked for its value.
     * @return Float The smallest value of the two given parameters.
     */
    public Float: fmin(Float: left, Float: right) {
        return floatcmp(left, right) < 0 ? left : right;
    }

    /**
     * Retrieve the biggest of the two given float arguments.
     *
     * @param left The first value which should be checked for its value.
     * @param right The second value which should be checked for its value.
     * @return Float The biggest value of the two given parameters.
     */
    public Float: fmax(Float: left, Float: right) {
        return floatcmp(left, right) > 0 ? left : right;
    }
};
