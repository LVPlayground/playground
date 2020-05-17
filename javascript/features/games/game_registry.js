// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The game registry will keep track of all games that have been registered on the server, their
// options and the right way to start them.
export class GameRegistry {
    commandDelegate_ = null;

    // Map of |gameConstructor| => |GameDescription| for each of the registered games on the server.
    games_ = null;

    constructor() {
        this.games_ = new Map();
    }

    // Sets the command delegate for the registry, which has the ability to create and delete the
    // commands through which players can start the individual games.
    setCommandDelegate(delegate) { this.commandDelegate_ = delegate; }

    // ---------------------------------------------------------------------------------------------

    // Registers the given game |description|, which contains all the information necessary for
    // figuring out how the game should be ran. Games will be stored keyed by their constructor.
    registerGame(description) {
        if (this.games_.has(description.gameConstructor))
            throw new Error(`The ${description.name} game has already been registered.`);
        
        // Create the command through which players can start this game, if any.
        if (this.commandDelegate_ && description.command)
            this.commandDelegate_.createCommandForGame(description);

        this.games_.set(description.gameConstructor, description);
    }

    // Removes the game previously registered with |gameConstructor| from the list of games that
    // are available on the server. In-progress games will be stopped immediately.
    removeGame(gameConstructor) {
        if (!this.games_.has(gameConstructor))
            throw new Error('Attempting to remove a game that has not yet registered.');
        
        const description = this.games_.get(gameConstructor);

        // Remove the command through which players could start this game, if any.
        if (this.commandDelegate_ && description.command)
            this.commandDelegate_.removeCommandForGame(description);

        // TODO: Request all active games of this type to be stopped.

        this.games_.delete(gameConstructor);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.games_.clear();
        this.games_ = null;
    }
}
