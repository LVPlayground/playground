// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Formats |message| with |parameters|. The following formatting rules are available:
//
//   %s  - String, will be passed in unmodified.
//   %d  - Integer, will be passed in unmodified.
//   %f  - Floating point. Will be passed in with two decimals.
//   %p  - Player name. Accepts either Player instances, strings (names) or numbers (Ids).
//   %$  - Money. Will be formatted as an amount in dollars.
//   %t  - Time. Will format minutes as MM:SS, hours as HH:MM:SS.
//   %%  - Literal percentage sign.
//
// Any other symbols followed by an percentage sign will be ignored.
export function format(message, ...parameters) {
    let substitutionIndex = 0;

    return String(message).replace(/%([sdfp\$t%])(\{(\-?\d+)\})?/g, (_, rule, ignore, index) => {
        if (rule === '%')
            return '%';  // special case: %% (percentage-sign literal).

        let value = null;
        if (index) {
            const numericIndex = parseInt(index, 10);
            if (numericIndex < 0 || numericIndex >= parameters.length)
                throw new Error('Invalid index supplied in substitution: ' + index);

            value = parameters[numericIndex];

        } else {
            if (substitutionIndex >= parameters.length)
                throw new Error('Not enough substitution parameters were provided for this query.');
            
            value = parameters[substitutionIndex++];
        }
        
        if (typeof value === 'undefined')
            return '[undefined]';
        else if (value === null)
            return '[null]';

        switch (rule) {
            case 's':
                return value.toString();
            case 'd':
                return formatNumber(value);
            case 'f':
                throw new Error('Formatting of floating point numbers is not yet implemented');
            case 'p':
                throw new Error('Formatting of player names is not yet implemented.');
            case '$':
                return formatPrice(value);
            case 't':
                return formatTime(value);
        }

        // All characters supported by the regular expression should be included in the switch above,
        // so we should never actually reach this line of code.
        return null;
    });
}

// Formats |value| as a number. Thousand separators will be inserted, and the number of decimals
// for floating point numbers will be limited to two.
export function formatNumber(value) {
    if (typeof value !== 'number')
        return value;

    let representation = Math.round(value * 100) / 100,
        parts = representation.toString().split('.');

    parts[0] = parts[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, ',');

    return parts.join('.');
}

// Formats |value| as a price. Effectively the same as formatting a number, but removes all the
// decimals from the amount and requires it to be a valid number.
export function formatPrice(value) {
    if (typeof value !== 'number')
        value = 0;

    return (value < 0 ? '-' : '') + '$' + formatNumber(Math.abs(Math.round(value)));
}

// Formats |time|. Anything under an hour will be formatted as MM:SS, whereas values over an hour
// will be formatted as HH:MM:SS instead. Non-numeric values will be returned as-is.
export function formatTime(time) {
    if (typeof time !== 'number')
        return time;

    let seconds = Math.floor(time % 60);
    let minutes = Math.floor(time / 60) % 60;
    let hours = Math.floor(time / 3600);

    let representation = '';

    if (hours > 0)
        representation += (hours < 10 ? '0' : '') + hours + ':';

    representation += (minutes < 10 ? '0' : '') + minutes + ':';
    representation += (seconds < 10 ? '0' : '') + seconds;

    return representation;
}
