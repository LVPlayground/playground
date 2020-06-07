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

// Implements support for `Transfer-Encoding: chunked`, which some servers use when the exact size
// of the output is not yet known when it started building the content.
export function handleChunkedTransferEncoding(responseBuffer) {
    const kAcceptedLengthCharacters = new Set([
        ...range(0x30, 0x39), 0x39, // 0-9
        ...range(0x41, 0x46), 0x46, // A-F
        ...range(0x61, 0x66), 0x66, // a-f 
    ]);

    let chunkLength = 0;
    let chunks = [];

    // Identify all the chunks in the |responseBuffer|, and split them up in the |chunks| array.
    // Each chunk has a four byte overhead: a \r\n after the size, and one before the next one. The
    // final chunk has a size of zero.
    for (let index = 0; index < responseBuffer.length; ++index) {
        let decimals = '';
        let decimal = index;
        
        for (; decimal < responseBuffer.length; ++decimal) {
            if (responseBuffer[decimal] === /* \r */ 0x0D)
                break;

            if (!kAcceptedLengthCharacters.has(responseBuffer[decimal])) {
                console.log('[fetch][warning] Invalid chunk in Transfer-Encoding: chunked data.');
                return responseBuffer;
            }

            decimals += String.fromCharCode(responseBuffer[decimal]);
        }

        const length = parseInt(decimals, 16);

        // (2) If the |length| is zero, then this is the final chunk. Bail out.
        if (!length)
            break;
        
        // (3) Otherwise, consume |length| bytes (minus overhead) and add it to |chunks|.
        chunks.push(responseBuffer.subarray(decimal + 2, decimal + 2 + length));
        chunkLength += length;

        // (4) Forward |index| to the beginning of the next chunk, again, ignoring overhead.
        index += (decimal - index) + 1 + length + 2;
    }

    if (!chunks && responseBuffer.length) {
        console.log('[fetch][warning] Invalid chunk data given for Transfer-Encoding: chunked.');
        return responseBuffer;
    }

    // Finally, append all |chunks| to a new decoded buffer, and return that to the caller, as the
    // chunking in the HTTP response has now been joined together into a single blob.
    const decodedBuffer = new Uint8Array(chunkLength);

    let currentLength = 0;
    for (const chunk of chunks) {
        decodedBuffer.set(chunk, currentLength);
        currentLength += chunk.length;
    }

    return decodedBuffer;
}
