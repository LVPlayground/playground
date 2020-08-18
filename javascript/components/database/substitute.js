// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Substitutes all the placeholders ("?") in the |query| with the given |parameters|. Each will be
// carefully checked to remove the probability of introducing SQL injections.
export function substitute(query, ...parameters) {
    let substitutionIndex = 0;

    return query.replace(/(^|[^\?])\?(?!\?)/g, (_, prefix) => {
        if (substitutionIndex >= parameters.length)
            throw new Error('Not enough substitution parameters were provided for this query.');

        return substituteValue(prefix, parameters[substitutionIndex], substitutionIndex++);
    });
}

// Substitutes the |value|. Arrays will be treated as multiple values that will each have to be
// substituted individually, e.g. [25, 26, 27] => "25, 26, 27".
function substituteValue(prefix, value, index) {
    if (Array.isArray(value) && value.length)
        return prefix + value.map(entry => substituteValue('', entry, index)).join(', ');

    switch (typeof value) {
        case 'boolean':
            return prefix + (!!value ? 'TRUE' : 'FALSE');

        case 'number':
            return prefix + substituteNumber(value);

        case 'string':
            return prefix + '"' + substituteString(value) + '"';

        case 'object':
            if (value === null)
                return prefix + 'NULL';

        /** deliberate fall-through for non-null values **/
        default:
            throw new Error(`Invalid type (${typeof value}) for substitution parameter #${index}`);
    }
}

// Creates a string out of |number|. It must be a valid, non-infinite number in range of significant
// precision imposed by JavaScript, which uses doubles, so 53 bits.
function substituteNumber(number) {
    if (Number.isNaN(number) || !Number.isFinite(number))
        throw new Error('Numbers in substitution parameters must not be NaN or infinity.');

    if (number < Number.MIN_SAFE_INTEGER || number > Number.MAX_SAFE_INTEGER)
        throw new Error('Numbers in substitution parameters must be in range JavaScript integers.');

    return number.toString();
}

// Creates a safe representation of |string|. This follows the MySQL escaping guidelines as set by
// the OWASP organisation: https://www.owasp.org/index.php/SQL_Injection_Prevention_Cheat_Sheet
function substituteString(string) {
    return string.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, character => {
        switch (character) {
            case '\0':   return '\\0';
            case '\x08': return '\\b';
            case '\x09': return '\\t';
            case '\x1a': return '\\z';
            case '\n':   return '\\n';
            case '\r':   return '\\r';
            case '\"':   return '\\"';
            case '\'':   return '\\\'';
            case '\\':   return '\\\\';
            case '%':    return '\\%';
        }

        // All characters in the regular expression will be handled in the switch, so this code
        // should never actually run.
        return null;
    });
}
