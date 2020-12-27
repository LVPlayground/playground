// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Interface that's supported by objects that wish to observe command usage. Observers have to be
// registered with the CommandManager, which will make sure that these methods will be invoked.
export class CommandObserver {
    // Called when the |player| has executed the |command|. The |result| is a boolean that indicates
    // whether execution of the command was successful, which could fail if parameter parsing fails.
    onCommandExecuted(player, command, result) {}

    // Called when the |player| has executed the |commandName|, which does not exist on the server.
    onUnknownCommandExecuted(player, commandName) {}
}
