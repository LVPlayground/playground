// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Formatter for currency, which will be done by ICU. Because there are no cents in Grand Theft Auto
// we drop any and all fraction digits that may be included in the number.
const kCurrencyFormat = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});

// Formatter for numbers. By default we prefer no fraction digits, but show up to the first two. If
// more fraction digits are necessary, the precision modifier can be used.
const kNumberFormat = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
});

// Placeholder types (single characters) that expect a number value to be given.
const kNumberPlaceholders = new Set('dfi$'.split(''));

// Regular expression used to fully understand the syntax of a placeholder.
const kPlaceholderExpression =
    /^(?:\{([^)]+)\})?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([bdfoisxX\$])/;

// Type of substitution that represents a literal passthrough for some text.
const kTypePassthrough = '📝';

// Formats |message| with the given |parameters|.
//
// This closely follows the semantics of `sprintf` for those who are aware of it, with a few
// additions to make it specific to our use-case. In short, the |message| can contain formatting
// operators, which will be substituted with one of the |parameters| also passed to this function.
//
//     format('Hello, %s!', 'world');           -->  'Hello, world!'
//     format('You have won %$.', 1234.56);     -->  'You have won $1,235.'
//
// The following placeholders are available:
//
//     %% - literal percentage sign
//     %b - integer in binary notation
//     %d - integer, any value within JavaScript's safe range (aliased by %i)
//     %f - floating point number
//     %o - integer in octal notation
//     %s - string, unmodified unless the precision argument has been used.
//     %x - integer in hexadecimal notation (lower-case)
//     %X - integer in hexadecimal notation (upper-case)
//     %$ - integer formatted as a price
//
// Furthermore, various placeholder modifiers are available for use. There are six:
//
//     1. An optional parameter index, when deriving from the regular order. These can be specified
//        in JavaScript array-index-like syntax:
//
//        format('[%{1}d]', 10, 20);   -->  '[20]'
//
//     2. An optional `+` sign that will force the plus sign to be displayed on numeric values,
//        which is omitted by default.
//
//        format('[%+d]', 25);     -->  '[+25]'
//
//     3. An optional padding character, when a width will be set (more on that later). Except for
//        the zero, all padding characters must be preceded by a single quote.
//
//        format('[%05d]', 25);    -->   '[00025]'
//        format(`[%'~5d]', 25);   -->   '[~~~25]'
//
//     4. An optional `-` sign, which will cause the significant value to be left-aligned instead.
//
//        format('[%-5d]', 25);    -->  '[25   ]'
//        format(`[%'~-5d]', 25);  -->  '[25~~~]'
//
//     5. An optional width. Padding will be added until (at least) this number of characters has
//        been reached. If no padding character was provided (see 2.), a space will be used instead.
//
//        format('[%5d]', 252);    -->  '[   25]'
//
//     6. An optional precision. For floating point values (%f) this will control the number of
//        decimals, for strings it will consider this a maximum length, and cap the string.
//
//        format('[%.3s]', 'banana');  -->  '[ban]'
//        format('[%f]', 1.2345);      -->  '[1.23]'
//        format('[%.4f]', 1.2345);    -->  '[1.2345]'
//
// It's possible to combine these modifiers to get to really powerful substitutions quickly, but be
// mindful of the fact that placeholders quickly get unreadable.
//
//     format(`[%'a6.3s]`, 'banana')   -->  '[banaaa]'
//
// Other placeholders will yield an exception, as the input |message| will be deemed invalid.
// Because of this, exclusively use parameters for processing player input. 
export function format(message, ...parameters) {
    const formattingList = parseMessageToFormattingList(message);
    const ropes = [];

    const originalParameters = parameters;

    // Walk over all entries in the |formattingList| and, as instructed, replace the placeholders
    // with the substitution values in the |parameters| array.
    for (const format of formattingList) {
        let parameter = null;

        if (format.hasOwnProperty('index')) {
            if (format.index < 0 || format.index >= originalParameters.length)
                throw new Error(`Out-of-bounds substitution index supplied: "${message}".`);
            
            parameter = originalParameters[format.index];

        } else if (format.type !== kTypePassthrough) {
            if (!parameters.length)
                throw new Error(`Not enough substitution parmeters supplied: "${message}".`);
            
            parameter = parameters.shift();
        }

        const negative = kNumberPlaceholders.has(format.type) && parameter < 0;

        let prefix = null;
        let value = null;

        switch (format.type) {
            case kTypePassthrough:
                ropes.push(format.text);
                break;
            
            case 'b':
                value = parseInt(parameter, 10).toString(2);
                break;

            case 'd':
            case 'i':
                value = kNumberFormat.format(parseInt(parameter, 10));
                break;
            
            case 'f':
                value = parseFloat(parameter);
                if (Number.isNaN(value)) {
                    value = 'NaN';
                } else if (format.hasOwnProperty('precision')) {
                    value = new Intl.NumberFormat('en-US', {
                        maximumFractionDigits: format.precision
                    }).format(value);
                } else {
                    value = kNumberFormat.format(value);
                }

                break;

            case 'o':
                value = parseInt(parameter, 10).toString(8);
                break;

            case 's':
                if (format.hasOwnProperty('precision'))
                    value = parameter.substring(0, format.precision);
                else
                    value = parameter;

                break;
            
            case 'x':
                value = (parseInt(parameter, 10) >>> 0).toString(16);
                break;
            
            case 'X':
                value = (parseInt(parameter, 10) >>> 0).toString(16).toUpperCase();
                break;

            case '$':
                value = kCurrencyFormat.format(parseInt(parameter, 10));
                break;

            default:
                throw new Error(`Invalid formatting type found: ${format.type}.`);
        }

        // If a |value| has been given then we're dealing with a substituted value, rather than a
        // pass-through string. There are additional steps to apply.
        if (value) {
            let sign = '';
            let string = '';

            // Populate the |sign| for numeric placeholders that are either negative, or forced.
            if (kNumberPlaceholders.has(format.type))
                sign = negative ? '-' : (format.sign ? '+' : '');

            // Populate the |string| with the |value| taken away the negative sign mark when set.
            // The sign will be added back later, after handling padding.
            if (negative)
                string = String(value).substring(1);
            else
                string = String(value);

            // Apply padding to the |string| if necessary. The character, length and position of
            // the padding are all configurable with parameters given in the placeholder.
            if (format.width !== 'undefined') {
                const paddingCharacter = format.padding ?? ' ';
                const paddingLength = format.width - sign.length - string.length;

                if (paddingLength > 0) {
                    const padding = paddingCharacter.repeat(paddingLength);
                    if (format.leftAlign)
                        ropes.push(sign, string, padding);
                    else if (paddingCharacter === '0')
                        ropes.push(sign, padding, string);
                    else
                        ropes.push(padding, sign, string);
                    
                    continue;
                }
            }

            // Otherwise just append the sign and string individually.
            ropes.push(sign, string);
        }
    }

    return ropes.join('');
}

// Parses the given |message| in a formatting list. In short, this isolates parts of the |message|
// which should be substituted (and how) from the parts of the message that should pass through.
export function parseMessageToFormattingList(message) {
    if (typeof message !== 'string')
        throw new Error(`Given messages must be of type string: "${message}".`);

    const length = message.length;
    const list = [];

    let start, index;

    // Iterate over the full string until we find the percentage sign, signaling a substitution. We
    // then use the regular expression in |kPlaceholderExpression| to understand what needs done.
    for (start = 0, index = 0; index < length; ++index) {
        if (message[index] != '%')
            continue;

        // Push all content since the last placeholder, which could be the start of the string, as a
        // pass-through value on the formatting |list|.
        if (index !== start) {
            list.push({
                type: kTypePassthrough,
                text: message.substring(start, index)
            });
        }

        const remainder = message.substring(index + 1);
        if (!remainder.length)
            throw new Error(`Unexpected end-of-string found: "${message}".`);

        // Handle the special case where a literal percentage sign should be added, which will be
        // "escaped" by the placeholder indicator.
        if (remainder[0] === '%') {
            list.push({
                type: kTypePassthrough,
                text: '%',
            });

            index += 1;
            start = index + 1;
            continue;
        }

        // Parse the placeholder, which |remainder| begins with, using the regular expression. This
        // will give us a full understanding of what's going on here.
        const match = kPlaceholderExpression.exec(remainder);
        if (!match)
            throw new Error(`Unparseable placeholder found: "${message}".`);

        let formatting = { type: match[7] };

        // Append each of the other parameter values in a sanitized way. These properties will be
        // absent on placeholder entries where they haven't been specified.
        if (match[1] !== undefined) formatting.index = parseInt(match[1], 10);
        if (match[2] !== undefined) formatting.sign = true;
        if (match[3] !== undefined) formatting.padding = match[3].replace(/^[']/, '');
        if (match[4] !== undefined) formatting.leftAlign = true;
        if (match[5] !== undefined) formatting.width = parseInt(match[5], 10);
        if (match[6] !== undefined) formatting.precision = parseInt(match[6], 10);

        list.push(formatting);

        // Skip past the |match|, and align both |start| and |index| with that.
        index += match[0].length;
        start = index + 1;
    }

    // If there is content left on the |message| that we haven't yet considered, add it manually to
    // not cut the string off early and have a loss of data.
    if (index !== start && start < length) {
        list.push({
            type: kTypePassthrough,
            text: message.substring(start)
        });
    }

    return list;
}
