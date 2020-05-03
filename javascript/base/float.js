// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Converts the given |value|, a JavaScript Number containing a series of bytes, to a floating
// point value. SA-MP has very few natives that return a float, and the PlaygroundJS-plugin
// is not currently able to cater for those.
export function toFloat(value) {
    var sign = ((value >>> 31) == 0) ? 1.0 : -1.0;
    var e = ((value >>> 23) & 0xff);
    var m = (e == 0) ? (value & 0x7fffff) << 1 : (value & 0x7fffff) | 0x800000;
    return sign * m * Math.pow(2, e - 150);
}
