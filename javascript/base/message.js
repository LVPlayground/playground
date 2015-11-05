// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const MESSAGE_DATA_FILE = 'data/messages.json';

// The message class will statically hold all defined messages, as well as provide utility functions
// for validating whether a message is safe. It also provides common functionality for formatting
// messages with otherwise unformatted (or even unsafe) content.
//
// When initializing the system, all messages will be loaded from messages.json in the data
// directory, and made available as a static member of the Message class. While loading the messages
// any unsafe messages will be considered to be a fatal error, as they might crash players.
class Message {
  // Formats |message| with |arguments|. The following formatting rules are available:
  //
  //   %s  - String, will be passed in unmodified.
  //   %d  - Integer, will be passed in unmodified.
  //   %f  - Floating point. Will be passed in with two decimals.
  //   %p  - Player name. Accepts either Player instances, strings (names) or numbers (Ids).
  //   %$  - Money. Will be formatted as an amount in dollars.
  //   %%  - Literal percentage sign.
  //
  // Any other symbols followed by an percentage sign will be ignored.
  static format(message, args...) {
    // TODO: Return the formatted message.
    return message;
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

      if (!Message.validate(message))
        throw new Error('The message named "' + identifier + '" is not safe for usage.');

      Message[identifier] = message;
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
