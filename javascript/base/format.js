// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Regular expression used to fully understand the syntax of a placeholder.
const kPlaceholderExpression = /^(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([ds])/;

// Types of substitutions that can be expected in formatted messages.
const kTypePassthrough = '📝';

// Formats |message| with the given |parameters|.
//
// This closely follows the semantics of `sprintf` for those who are aware of it, with a few
// additions to make it specific to our use-case. In short, the |message| can contain formatting
// operators, which will be substituted with one of the |parameters| also passed to this function.
//
//     format('Hello, %s!', 'world');           --> 'Hello, world!'
//     format('You have won %$.', 1234.56);     --> 'You have won $1,235.'
//
// The following placeholders are available:
//
//     %% - literal percentage sign
//
// Other placeholders will yield an exception, as the input |message| will be deemed invalid.
// Because of this, exclusively use parameters for processing player input. 
export function format(message, ...parameters) {
    const formattingList = parseMessageToFormattingList(message);
    const ropes = [];

    for (const format of formattingList) {
        switch (format.type) {
            case kTypePassthrough:
                ropes.push(format.text);
                break;
            
            default:
                throw new Error(`Invalid formatting type found: ${format.type}.`);
        }
    }

    return ropes.join('');
}

// Parses the given |message| in a formatting list. In short, this isolates parts of the |message|
// which should be substituted (and how) from the parts of the message that should pass through.
export function parseMessageToFormattingList(message) {
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

        ++index;  // remove the %

        const remainder = message.substring(index);
        if (!remainder.length)
            throw new Error(`Unexpected end-of-string found: "${message}".`);

        // Handle the special case where a literal percentage sign should be added, which will be
        // "escaped" by the placeholder indicator.
        if (remainder[0] === '%') {
            list.push({
                type: kTypePassthrough,
                text: '%',
            });

            start = index + 1;
            continue;
        }

        // Parse the placeholder, which |remainder| begins with, using the regular expression. This
        // will give us a full understanding of what's going on here.
        const match = kPlaceholderExpression.exec(remainder);
        if (!match)
            throw new Error(`Unparseable placeholder found: "${message}".`);

        let formatting = { type: match[6] };

        // Append each of the other parameter values in a sanitized way. These properties will be
        // absent on placeholder entries where they haven't been specified.
        if (match[1]) formatting.sign = true;
        if (match[2]) formatting.padding = match[2].replace(/^[']/, '');
        if (match[3]) formatting.leftAlign = true;
        if (match[4]) formatting.width = parseInt(match[4], 10);
        if (match[5]) formatting.precision = parseInt(match[5], 10);

        list.push(formatting);

        // Skip past the |match|, and align both |start| and |index| with that.
        index += match[0].length;
        start = index;
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
