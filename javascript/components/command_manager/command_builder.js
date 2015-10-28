// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The command builder provides a convenient interface to build commands on, together with all the
// options that are possible to have for commands. A variety of checks will be done to ensure that
// the command will work consistently and reliably.
class CommandBuilder {
  constructor(level, parent, command) {
    this.level_ = level;
    this.parent_ = parent;
    this.command_ = command;

    this.listener_ = null;
  }

  // Builds the command constructed by this builder, invoking |listener| when it got executed. Top-
  // level commands will be registered with the command manager, whereas sub-commands will be
  // registered with their parent command.
  build(listener) {
    this.listener_ = listener || null;

    if (this.level_ == CommandBuilder.SUB_COMMAND) {
      // TODO: Register the sub-command.
      return this.parent_;
    }

    // TODO: Create a command listener.

    this.parent_.registerCommand(this.command_, null);
    return null;
  }
};

// Used for top-level commands of the command builder.
CommandBuilder.COMMAND = 0;

// Used for sub-commands created using the command builder.
CommandBuilder.SUB_COMMAND = 1;

exports = CommandBuilder;
