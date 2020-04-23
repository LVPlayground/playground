// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { format as stringFormat } from 'base/string_formatter.js';

// The JSON file in which the message format for all IRC messages has been stored.
const kMessagesFile = 'data/irc_messages.json';

// Converts a message identifier with a sequence of parameters to a formatted IRC message that can
// be distributed to an echo channel. Includes a routine to intepret Pawn messages too.
export class MessageFormatter {
    messages_ = new Map();

    constructor(forceProdForTesting = false) {
        if (server.isTest() && !forceProdForTesting) {
            this.loadMessages({
                test: 'Hello %s, I have %$ for %d days!',
                test_int: '%d',
                test_float: '%f',
                test_string: '%s',
                test_dsz: '%d %s %s',
                test_ffd: '%d %d %d',
            });
        } else {
            this.loadMessages(JSON.parse(readFile(kMessagesFile)));
        }
    }

    // Loads the given |messages|. This is expected to be an object where each key is the message
    // name, and the value is the string it should be formatted as.
    loadMessages(messages) {
        this.messages_ = new Map(Object.entries(messages));
    }

    // Formats the given |tag| with the available |params|. Returns a string that can be directly
    // distributed to the server. The format matches the StringFormat one, namely:
    //
    //   %s  - String, will be passed in unmodified.
    //   %d  - Integer, will be passed in unmodified.
    //   %f  - Floating point. Will be passed in with two decimals.
    //   %p  - Player name. Accepts either Player instances, strings (names) or numbers (Ids).
    //   %$  - Money. Will be formatted as an amount in dollars.
    //   %t  - Time. Will format minutes as MM:SS, hours as HH:MM:SS.
    //   %%  - Literal percentage sign.
    //
    // To broaden support for additional formatters, refer to the string formatter itself.
    format(tag, ...params) {
        if (!this.messages_.has(tag))
            throw new Error('Invalid message tag given: ' + tag);

        return stringFormat(this.messages_.get(tag), ...params);
    }

    // Formats the Pawn-sourced |message| assuming the given |format|. Will return a string
    // that can be echoed directly to the server. The |messageString| has to be in a particular
    // format, namely according to the following:
    //
    //   d  - Integer
    //   f  - Floating point (decimal) number
    //   s  - Single word
    //   z  - Multiple words
    //
    // Because a word is able to contain anything, the "s" format may only come as the final
    // entry in the |format| array because it will consume the rest of the |messageString|.
    formatPawn(tag, format, messageString) {
        if (!this.messages_.has(tag))
            throw new Error('Invalid message tag given: ' + tag);

        const params = [];
        let offset = 0;

        // Iterate over each of the characters included in the |format|, and peel off an
        // argument from the |messageString| assuming it's formatted as such.
        for (const character of format) {
            let nextSpace = messageString.indexOf(' ', offset);
            if (nextSpace === -1)
                nextSpace = messageString.length;

            if (offset === nextSpace)
                throw new Error('No more parameters to consume from the `messageString`.');

            switch (character) {
                case 'd':
                    params.push(parseInt(messageString.substring(offset, nextSpace), 10));
                    break;

                case 'f':
                    params.push(parseFloat(messageString.substring(offset, nextSpace)));
                    break;

                case 's':
                    params.push(messageString.substring(offset, nextSpace));
                    break;

                case 'z':
                    params.push(messageString.substring(offset));
                    break;

                default:
                    throw new Error('Invalid formatting character given: ' + character);
            }

            offset = nextSpace + 1;
        }

        return this.format(tag, ...params);
    }

    dispose() {}
}
