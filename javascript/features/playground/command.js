// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The Command class forms the base class of all commands that can be toggled with the `/lvp access`
// command, and has knowledge of several common objects.
class Command {
    constructor(announce) {
        this.announce_ = announce;
    }

    // Gets the name of the current command. Must be implemented by the command.
    get name() {
        throw new Error('Command::name getter must be implemented by the command.');
    }

    // Gets the default player level required to execute the command. Must be implemented by the
    // command. Can be overridden using the `/lvp access` command.
    get defaultPlayerLevel() {
        throw new Error(
            'Command::defaultPlayerLevel getter must be implemented by the command: /' + this.name);
    }

    // Builds the command based on |commandBuilder|. Must be implemented by the command.
    build(commandBuilder) {
        throw new Error('Command::build() must be implemented by the command: /' + this.name);
    }

    // Removes the command from the command manager. May be overridden by the command, but it should
    // be sure to call this one too when it does.
    dispose() {
        server.commandManager.removeCommand(this.name);
    }
}

exports = Command;
