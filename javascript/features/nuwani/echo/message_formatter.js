// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { format as stringFormat } from 'base/format.js';

// The JSON file in which the message format for all IRC messages has been stored.
const kMessagesFile = 'data/irc_messages.json';

// Regular expression that can be used to validate a custom message target. This doesn't actually
// adhere to the RPL_ISUPPORT information the server sends us, but should be generic enough.
const kValidTargetParamExpression = /^\{(\d+)\}$/;
const kValidTargetExpression = /^[a-z_\-\[\]\\^{}|`#&][a-z0-9_\.\-\[\]\\^{}|`#&]*$/i;

// Converts a message identifier with a sequence of parameters to a formatted IRC message that can
// be distributed to an echo channel. Includes a routine to intepret Pawn messages too.
export class MessageFormatter {
    echoChannel_ = null;
    messages_ = new Map();

    constructor(echoChannel, forceProdForTesting = false) {
        this.echoChannel_ = echoChannel;

        if (server.isTest() && !forceProdForTesting) {
            this.loadMessages({
                test: 'Hello %s, I have %$ for %d days!',
                test_int: '%.2f',
                test_float: '%f',
                test_string: '%s',
                test_dsz: '%d %s %s',
                test_ffd: '%.2f %.2f %d',
                test_color_invalid: '<color:51>',
                test_color: '<color:3>1 <color:15>yo <color>test',
                test_empty: 'Regular string',
                test_prefix_vip: '<prefix:+>Hello',
                test_prefix_admin: '<prefix:@>Hello',
                test_prefix_invalid: '<prefix:hello>World',
                test_target_invalid: '<target:***>Hello',
                test_target_private: '<target:#vip>Hello',
                test_target_nickname: '<target:Joe>Hello',
                test_target_prefix: '<target:#vip><prefix:%>Hello',
                test_target_param: '<target:{0}>Hello',
                test_target_param2: '<target:{1}>%s',
                test_command_notice: '<command:NOTICE>Hello',
                text_command_target_notice: '<command:NOTICE><target:{0}>%{1}s',
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

    // Reloads the message format from the |kMessagesFile| on disk. This will throw an exception
    // in case of JSON parsing errors, so callers must be sure to handle these.
    reloadFormat() {
        this.loadMessages(JSON.parse(readFile(kMessagesFile)));
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
    // To broaden support for additional formatters, refer to the string formatter itself. In
    // addition to these formatting characters, style and behaviour can be amended as well:
    //
    //   <color:0-15>   Opens a colour block for the indicated color.
    //   <color>        Closes any colour block.
    //   <prefix:?>     Allows a single-character channel access prefix for the message.
    //   <target:?>     Allows the message to be sent to a different channel or user.
    //   <target:{?}>   Allows the message to be sent to the target defined in one of the
    //                  parameters. Verification will still have to succeed.
    //
    // These embedded tags may only occur in the format, not in any of the arguments or styling
    // data. They will be ignored there.
    format(tag, ...params) {
        if (!this.messages_.has(tag))
            throw new Error('Invalid message tag given: ' + tag);

        let command = 'PRIVMSG';
        let destination = this.echoChannel_;
        let destinationPrefix = '';

        let format = this.messages_.get(tag);

        // Replace embedded colours and styling with the appropriate control characters.
        format = format.replace(/<color>/g, '\x03');
        format = format.replace(/<color:(\d+)>/g, (_, color) => {
            const numericColour = parseInt(color, 10);
            if (numericColour < 0 || numericColour > 15)
                throw new Error(`[${tag}] Invalid IRC colour code: ${color}`);
            
            return '\x03' + ('0' + numericColour.toString()).substr(-2);
        });

        // Allow for configurable channel access prefixes in the message format.
        format = format.replace(/<prefix:(.+?)>/g, (_, prefix) => {
            if (prefix.length !== 1)
                throw new Error(`[${tag}] Invalid IRC access prefix: ${prefix}`);
            
            destinationPrefix = prefix;
            return '';
        });

        // Allow for configurable destination targets, e.g. for crew and management chat. This can
        // either be hardcoded in the format, or be dynamic based on a parameter.
        format = format.replace(/<target:(.+?)>/g, (_, target) => {
            let actualTarget = null;

            const matches = target.match(kValidTargetParamExpression);
            if (matches !== null) {
                const parameterIndex = parseInt(matches[1]);
                if (parameterIndex < 0 || parameterIndex >= params.length)
                    throw new Error(`[${tag}] Invalid message target: ${matches[1]}`);
                
                actualTarget = params[parameterIndex];
            } else {
                actualTarget = target;
            }

            if (!kValidTargetExpression.test(actualTarget))
                throw new Error(`[${tag}] Invalid message target: ${actualTarget}`);
            
            destination = actualTarget;
            return '';
        });

        // Allow for the type of IRC command to be changed as well.
        format = format.replace(/<command:(.+?)>/g, (_, unverifiedCommand) => {
            if (!['NOTICE', 'MODE'].includes(unverifiedCommand))
                throw new Error('Only NOTICE and MODE commands are enabled for now.');
            
            command = unverifiedCommand;
            return '';
        });

        // Now format the actual message according to |format|. This is done last, to ensure that
        // the non-fixed part of the string cannot influence the above filtering.
        const formattedMessage = stringFormat(format, ...params);

        return `${command} ${destinationPrefix}${destination} :${formattedMessage}`;
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
            while (messageString.length > offset && messageString[offset] === ' ')
                ++offset;  // skip excess whitespace

            let nextSpace = messageString.indexOf(' ', offset);
            if (nextSpace === -1)
                nextSpace = messageString.length;

            if (offset === nextSpace)
                throw new Error(`[${tag}] No more parameters available to consume.`);

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
                    params.push(messageString.trimEnd().substring(offset));
                    break;

                default:
                    throw new Error(`[${tag}] Invalid formatting character: ${character}`);
            }

            offset = nextSpace + 1;
        }

        return this.format(tag, ...params);
    }

    dispose() {}
}
