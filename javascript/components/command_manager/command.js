// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The command class encapsulates the information associated with a command built by the command
// builder. It provides an invoke() function that may be used to execute the command.
class Command {
  constructor(command, listener) {
    this.command_ = command;
    this.listener_ = listener;
  }

  // Invokes this command for |player|, with |args|. The arguments will be parsed according to the
  // known parameters for this command.
  invoke(player, args) {
    if (!this.listener_) {
      console.log('Warning: ' + player.name + ' executed command /' + this.command_ + ', which has no listener.');
      return;
    }

    // TODO: Parse the commands.

    this.listener_(player, args);
  }
};

// Recognized parameter types for individual command parameters.
Command.NUMBER_PARAMETER = 0;
Command.WORD_PARAMETER = 1;
Command.SENTENCE_PARAMETER = 2;
Command.PLAYER_PARAMETER = 3;

exports = Command;
