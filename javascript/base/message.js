// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// File in which the messages are stored. Must be in JSON format.
const MESSAGE_DATA_FILE = 'data/messages.json';

// Known message prefixes. These are substitutions for the most common contents of messages, for
// example usage information or errors. In the message syntax, they are prepended by an at-sign.
const MESSAGE_PREFIXES = {
  error: '{DC143C}Error{FFFFFF}: ',
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
  static format(message, ...parameters) {
    let substitutionIndex = 0;
    return message.replace(/%([sdfp\$t%])/g, (_, rule) => {
      if (rule == '%')
        return '%';  // special case: %% (percentage-sign literal).

      if (substitutionIndex >= parameters.length)
        throw new Error('Not enough substitution parameters were provided for this query.');

      let value = parameters[substitutionIndex++];
      if (typeof value === 'undefined')
        return '[undefined]';
      else if (value === null)
        return '[null]';

      switch (rule) {
        case 's':
          return value.toString();
        // TODO: %d
        // TODO: %f
        // TODO: %p
        // TODO: %$
        case 't':
          return this.formatTime(value);
      }

      // All characters supported by the regular expression should be included in the switch above,
      // so we should never actually reach this line of code.
      return null;
    });
  }

  // Formats |time|. Anything under an hour will be formatted as MM:SS, whereas values over an hour
  // will be formatted as HH:MM:SS instead. Non-numeric values will be returned as-is.
  static formatTime(time) {
    if (typeof time !== 'number')
      return time;

    let seconds = time % 60;
    let minutes = Math.floor(time / 60) % 60;
    let hours = Math.floor(time / 3600);

    let representation = '';

    if (hours > 0)
      representation += (hours < 10 ? '0' : '') + hours + ':';

    representation += (minutes < 10 ? '0' : '') + minutes + ':';
    representation += (seconds < 10 ? '0' : '') + seconds;

    return representation;
  }

  // Filters all colours from |message| and returns the remainder of the message.
  static filter(message) {
    return message.replace(/\{[0-9A-F]{6,8}\}/gi, '');
  }

  // Loads messages from |file|. Unsafe messages will be considered as fatal errors.
  static loadMessages(file) {
    let messages = JSON.parse(readFile(file));
    if (!messages || typeof messages !== 'object')
      throw new Error('Unable to read messages from data file: ' + file);

    Object.keys(messages).forEach(identifier => {
      let message = messages[identifier];
      if (Message.hasOwnProperty(identifier))
        throw new Error('A message named "' + identifier + '" has already been created.');

      message = Message.substitutePrefix(message, identifier);

      if (!Message.validate(message))
        throw new Error('The message named "' + identifier + '" is not safe for usage.');

      Message[identifier] = message;
    });
  }

  // Substitutes any @-prefixes in |message| with the intended text. This will also affect the color
  // of the remainder of the message when the prefix uses a color.
  static substitutePrefix(message, identifier) {
    if (!message.startsWith('@'))
      return message;

    return message.replace(/^@([^\s]+)\s*/, (_, prefixName) => {
      if (!MESSAGE_PREFIXES.hasOwnProperty(prefixName))
        throw new Error('The message named "' + identifier + '" uses an invalid prefix: @' + prefixName);

      return MESSAGE_PREFIXES[prefixName];
    });
  }

  // Validates that |message| can safely be send to users.
  static validate(message) {
    // TODO: Figure out and implement the appropriate safety rules.
    return true;
  }
};

// Immediately load the messages from the primary message data file.
Message.loadMessages(MESSAGE_DATA_FILE);

// Expose the Message class on the global object, since it will be common practice for features to
// format messages or deal with predefined ones.
global.Message = exports = Message;
