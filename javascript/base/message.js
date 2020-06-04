// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { format as stringFormat, formatNumber, formatPrice, formatTime } from 'base/string_formatter.js';

// File in which the messages are stored. Must be in JSON format.
const kMessageDataFile = 'data/messages.json';

// Known message prefixes. These are substitutions for the most common contents of messages, for
// example usage information or errors. In the message syntax, they are prepended by an at-sign.
export const kMessagePrefixes = {
    error: '{DC143C}Error{FFFFFF}: ',
    info: '',  // TODO: Do we need a particular prefix?
    success: '{33AA33}Success{FFFFFF}: ',
    usage: '{FF9900}Usage{FFFFFF}: ',
};

// The message class will statically hold all defined messages, as well as provide utility functions
// for validating whether a message is safe. It also provides common functionality for formatting
// messages with otherwise unformatted (or even unsafe) content.
//
// When initializing the system, all messages will be loaded from messages.json in the data
// directory, and made available as a static member of the Message class. While loading the messages
// any unsafe messages will be considered to be a fatal error, as they might crash players.
class Message {
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
    static format = stringFormat;

    static formatPrice = formatPrice;
    static formatTime = formatTime;
    static formatNumber = formatNumber;

    // Filters all colours from |message| and returns the remainder of the message.
    static filter(message) {
        return message.replace(/\{[0-9A-F]{6,8}\}/gi, '');
    }

    // Loads messages from |kMessageDataFile|. Unsafe messages will be considered as fatal errors.
    static loadMessages() {
        let messages = JSON.parse(readFile(kMessageDataFile));
        if (!messages || typeof messages !== 'object')
            throw new Error('Unable to read messages from data file: ' + kMessageDataFile);

        Message.installMessages(messages);
    }

    // Reloads the messages when the server is already running. All uppercase-only properties on the
    // Message function will be removed, after which the format will be reloaded again.
    static reloadMessages() {
        // Load the |messages| first, so that any JSON errors won't result in the server being
        // completely busted, and nothing being sent to anyone at all.
        const messages = JSON.parse(readFile(kMessageDataFile));

        let originalMessageCount = 0;
        for (const property of Object.getOwnPropertyNames(Message)) {
            if (property.toUpperCase() !== property)
                continue;
   
            delete Message[property];
            originalMessageCount++;
        }

        return {
            originalMessageCount,
            messageCount: Message.installMessages(messages)
        };
    }

    // Installs the given |messages| on the Message object. Returns the number of messages that
    // have been installed on the object.
    static installMessages(messages) {
        let messageCount = 0;

        for (let [identifier, messageText] of Object.entries(messages)) {
            if (!Message.validate(messageText))
                throw new Error(`The message named "${identifier}" is not safe for usage.`);

            messageText = Message.substitutePrefix(messageText, identifier);

            Object.defineProperty(Message, identifier, {
                value: new Message(messageText),
                configurable: true,
                writable: false,
            });

            messageCount++;
        }

        return messageCount;
    }

    // Substitutes any @-prefixes in |message| with the intended text. This will also affect the color
    // of the remainder of the message when the prefix uses a color.
    static substitutePrefix(message, identifier) {
        if (!message.startsWith('@'))
            return message;

        return message.replace(/^@([^\s]+)\s*/, (_, prefixName) => {
            if (!kMessagePrefixes.hasOwnProperty(prefixName))
                throw new Error('The message named "' + identifier + '" uses an invalid prefix: @' + prefixName);

            return kMessagePrefixes[prefixName];
        });
    }

    // Validates that |message| can safely be send to users.
    static validate(message) {
        // TODO: Figure out and implement the appropriate safety rules.
        return true;
    }

    // Constructs a new Message object for |message|. Can be silently converted to a string.
    constructor(message) {
        this.message_ = message;
    }

    // Called when converting this class to a string, either implicitly or explicitly.
    toString() {
        return this.message_;
    }
};

// Immediately load the messages from the primary message data file.
Message.loadMessages();

// Expose the Message class on the global object, since it will be common practice for features to
// format messages or deal with predefined ones.
global.Message = Message;

export default Message;
