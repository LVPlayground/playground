// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { random } from 'base/random.js';
import { range } from 'base/range.js';
import { stringToUtf8Buffer, utf8BufferToString } from 'components/networking/utf-8.js';

// The characters which a HEX string can be formatted as; base-16.
const kHexCharacters = '0123456789ABCDEF'.split('');

// The characters that are safe to use in encoded strings.
const kSafeCharacters = new Set([
    ...range(0x30, 0x39), 0x39,  // numbers
    ...range(0x41, 0x5A), 0x5A,  // uppercase characters
    ...range(0x61, 0x7A), 0x7A,  // lowercase characters
    0x2D, 0x2E, 0x5F, 0x2A,      // { - . _ * }, url-safe characters
]);

// Decodes the given |value| per the rules of HTML:
// http://www.w3.org/TR/html4/interact/forms.html#h-17.13.4.1
export function decode(value) {
    const buffer = new Uint8Array(stringToUtf8Buffer(value));
    const output = [];

    for (let index = 0; index < buffer.length; ++index) {
        const character = buffer[index];

        // Convert spaces back to.. spaces, as they're represented by plus signs.
        if (character === /* + */ 0x2B) {
            output.push(0x20);  // space
            continue;
        }

        // If this isn't a percentage sign, it's a pass-through character.
        if (character !== /* % */ 0x25) {
            output.push(character);
            continue;
        }

        // Ignore invalid encoded text, nothing we can do for partial input.
        if ((index + 2) >= buffer.length) {
            index += 2;
            continue;
        }

        const major = kHexCharacters.indexOf(String.fromCharCode(buffer[++index]));
        const minor = kHexCharacters.indexOf(String.fromCharCode(buffer[++index]));

        if (major === -1 || minor === -1)
            continue;  // invalid code point

        output.push(major * 16 + minor);
    }

    return utf8BufferToString(new Uint8Array(output));
}

// Encodes the given |value| per the rules of HTML:
// http://www.w3.org/TR/html4/interact/forms.html#h-17.13.4.1
export function encode(value) {
    const buffer = new Uint8Array(stringToUtf8Buffer(value));
    const output = [];

    for (let index = 0; index < buffer.length; ++index) {
        const character = buffer[index];

        if (kSafeCharacters.has(character)) {
            output.push(character);
        } else if (character === /* space */ 0x20) {
            output.push(0x2B);  // +
        } else {
            output.push(0x25);  // %
            output.push(kHexCharacters[Math.floor(character / 16)].charCodeAt(0));
            output.push(kHexCharacters[character % 16].charCodeAt(0));
        }
    }

    return utf8BufferToString(new Uint8Array(output));
}

// Quotes the given |string|, meaning that new lines, carriage returns and quotes will be escaped.
export function quote(value) {
    return value.replaceAll('\n', '%0A')
                .replaceAll('\r', '%0D')
                .replaceAll('"', '%22');
}

// Generates a boundary for multi-part form mime encoding.
export function generateBoundary() {
    const kAcceptedCharacters = [
        ...range(0x30, 0x39), 0x39,  // numbers
        ...range(0x41, 0x5A), 0x5A,  // uppercase characters
        ...range(0x61, 0x7A), 0x7A,  // lowercase characters
    ];

    const kLength = 16;

    let boundary = '----lvpFormBoundary';
    for (let char = 0; char < kLength; ++char)
        boundary += String.fromCharCode(kAcceptedCharacters[random(kAcceptedCharacters.length)]);

    return boundary;
}
