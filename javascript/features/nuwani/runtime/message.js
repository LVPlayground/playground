// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { MessageSource } from 'features/nuwani/runtime/message_source.js';

// Encapsulates a message received. rfc8212 is quite prescriptive in how these can be formatted, but
// a surprising amount of flexibility is allowed nonetheless. This parser breaks it up in the three
// key parts: the message source, command and parameters.
//
// The implementation follows the following ABNF syntax:
//
//   message    =  [ ":" prefix SPACE ] command [ params ] crlf
//
//   command    =  1*letter / 3digit
//   params     =  *14( SPACE middle ) [ SPACE ":" trailing ]
//              =/  14( SPACE middle ) [ SPACE [ ":" ] trailing ]
//
//   middle     =  nospcrlfcl *( ":" / nospcrlfcl )
//   trailing   =  *( ":" / " " / nospcrlfcl )
//
// The ending crlf has already been removed by the Connection class, as messages will be split based
// on that delimiter. Parsing here is done leniently, to allow for improved compatibility.
export class Message {
    source_ = null;
    command_ = null;
    params_ = [];

    // Gets the source of this message, if any. Non-NULL values will be instances of the
    // MessageSource class with the appropriate fields set.
    get source() { return this.source_; }

    // Gets the command of this message, which is either numeric or textual. The command will always
    // be returned in uppercase, to avoid the rest of the code from having to think about casing.
    get command() { return this.command_; }

    // Gets the parameters associated with this message. Always an array.
    get params() { return this.params_; }

    constructor(message) {
        if (typeof message !== 'string' || !message.length)
            throw new Error(`Invalid message given: ${message}`);

        let position = 0;

        // Utility function to skip |position| to the next non-whitespace character. Will return the
        // |position| for convenient use in method calls.
        const positionTrimmedForWhitespace = () => {
            while (position < message.length && message[position] === ' ')
                ++position;
            
            return position;
        }

        position = this.parseSource(message, positionTrimmedForWhitespace());
        position = this.parseCommand(message, positionTrimmedForWhitespace());

        while (position < message.length)
            position = this.parseParam(message, positionTrimmedForWhitespace());
    }

    // Parses the source of the |message|, starting at the given |position|.
    parseSource(message, position) {
        if (message[position] !== ':')
            return position;
        
        const nextSpace = message.indexOf(' ', position);
        if (nextSpace === -1)
            throw new Error(`Invalid message given (prefix): ${message}`);

        this.source_ = new MessageSource(message.substring(position + 1, nextSpace));
        return nextSpace;
    }

    // Parses the command of the |message|, starting at the given |position|.
    parseCommand(message, position) {
        const nextSpace = message.indexOf(' ', position);
        const command = message.substring(position, nextSpace > position ? nextSpace : undefined);

        if (!/^[a-z0-9]{3,}$/i.test(command))
            throw new Error(`Invalid message given (command): ${message}`);
        
        this.command_ = command.toUpperCase();
        return nextSpace > position ? nextSpace :
                                      message.length;
    }

    // Parses a parameter of the |message|, starting at the given |position|. If the parameter
    // starts with a colon, the rest of the |message| will be consumed.
    parseParam(message, position) {
        if (message[position] === ':') {
            this.params_.push(message.substring(position + 1).trimEnd());
            return message.length;
        }

        const nextSpace = message.indexOf(' ', position);
        if (nextSpace === -1) {
            this.params_.push(message.substring(position));
            return message.length;
        }

        this.params_.push(message.substring(position, nextSpace));
        return nextSpace;
    }

    // Converts this instance back to a string. This isn't guaranteed to be identical to the input
    // string, particularly because whitespace will have been amended.
    toString() {
        let output = '';

        if (this.source_)
            output += `:${this.source_} `;
        
        output += this.command;

        this.params_.forEach((param, i) => {
            if ((i + 1) === this.params_.length)
                output += ` :` + param;
            else
                output += ` ` + param;
        });

        return output;
    }
}
