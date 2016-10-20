// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Returns the value as an integer in string representation with an ordinal suffix.
Number.prototype.toOrdinalString = function() {
    const suffixes = ['th', 'st', 'nd', 'rd'];

    const floored = Math.floor(this);
    const normalized = floored % 100;

    return floored + (suffixes[(normalized - 20) % 10] || suffixes[normalized] || suffixes[0]);
};
