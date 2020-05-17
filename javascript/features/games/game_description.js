// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Determines if the given |gameConstructor| has a class named "Game" in its prototype chain. We
// cannot use `isPrototypeOf` here, since the actual instances might be subtly different when live
// reload has been used on the server.
function hasGameInPrototype(gameConstructor) {
    let currentConstructor = gameConstructor;
    while (currentConstructor.name && currentConstructor.name !== 'Game')
        currentConstructor = currentConstructor.__proto__;
    
    return currentConstructor.name === 'Game';
}

// Full description of a game and all options related to the game. This dictates how players can
// sign-up, what their available options are, how the game will be represented and which events the
// Game implementation of the game will receive. Immutable once created.
export class GameDescription {
    gameConstructor_ = null;

    name_ = null;
    command_ = null;

    // Gets the constructor which can be used to instantiate the game.
    get gameConstructor() { return this.gameConstructor_; }

    // Gets the name of this game.
    get name() { return this.name_; }

    // Gets the name of the command which can be used to start the game. Optional, thus may be NULL.
    get command() { return this.command_; }

    constructor(gameConstructor, options) {
        if (!hasGameInPrototype(gameConstructor))
            throw new Error('Each game must override the `Game` base class in this feature.');

        this.gameConstructor_ = gameConstructor;
        
        // -----------------------------------------------------------------------------------------
        // Section: required options
        // -----------------------------------------------------------------------------------------

        if (!options.hasOwnProperty('name') || typeof options.name !== 'string')
            throw new Error('Each game must indicate its name as a string.');

        this.name_ = options.name;

        // -----------------------------------------------------------------------------------------
        // Section: optional options
        // -----------------------------------------------------------------------------------------

        if (options.hasOwnProperty('command')) {
            if (typeof options.command !== 'string')
                throw new Error(`[${this.name_}] The game's command must be given as a string.`);
            
            this.command_ = options.command;
        }
    }
}
