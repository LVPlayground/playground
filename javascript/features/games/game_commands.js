// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// This class is responsible for making sure that all the appropriate commands for games on the
// server are made available, as well as canonical functionality such as the `/challenge` command.
export class GameCommands {
    commands_ = null;
    registry_ = null;

    // Gets the |commands_| map for testing purposes.
    get commandsForTesting() { return this.commands_; }

    constructor(registry) {
        this.registry_ = registry;
        this.registry_.setCommandDelegate(this);

        // Set of commands that have been registered on the server for individual games.
        this.commands_ = new Set();
    }

    // ---------------------------------------------------------------------------------------------

    // Creates and registers a command to start the game described in |description|.
    createCommandForGame(description) {
        const commandName = description.command;

        if (this.commands_.has(commandName))
            throw new Error(`A game with the /${commandName} command has already been registered.`);
        
        // Registers the |commandName| with the server, so that everyone can use it.
        server.commandManager.buildCommand(commandName)
            .build(GameCommands.prototype.onCommand.bind(this, description));
        
        this.commands_.add(commandName);
    }

    // Removes the command that had been created to start the game described in |description|.
    removeCommandForGame(description) {
        const commandName = description.command;

        if (!this.commands_.has(commandName))
            throw new Error(`No game with the /${commandName} command has been registered yet.`);
        
        // Removes the |commandName| from the server, so that people can't use it anymore.
        server.commandManager.removeCommand(commandName);

        this.commands_.delete(commandName);
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the |player| has executed the command necessary to start the game described in
    // the given |description|. This will either sign them up, or start the sign-up flow.
    onCommand(description, player) {
        // TODO: Implement a basic sign-up flow.
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.registry_.setCommandDelegate(null);
        this.registry_ = null;

        for (const commandName of this.commands_)
            server.commandManager.removeCommand(commandName);
    
        this.commands_ = null;
    }
}
