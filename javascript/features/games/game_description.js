// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The default number of maximum players who can participate in a game.
export const kDefaultMaximumPlayers = 4;

// The default number of minimum players who can participate in a game.
export const kDefaultMinimumPlayers = 2;

// The default price of participating in a game. Can be overridden by individual games.
export const kDefaultPrice = 250;

// The default interval at which ticks will be delivered to a game.
export const kDefaultTickIntervalMs = 1000;

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
    maximumPlayers_ = kDefaultMaximumPlayers;
    minimumPlayers_ = kDefaultMinimumPlayers;
    price_ = kDefaultPrice;
    tick_ = kDefaultTickIntervalMs;

    // Gets the constructor which can be used to instantiate the game.
    get gameConstructor() { return this.gameConstructor_; }

    // Gets the name of this game.
    get name() { return this.name_; }

    // Gets the name of the command which can be used to start the game. Optional, thus may be NULL.
    get command() { return this.command_; }

    // Gets the maximum number of players who can participate in this game.
    get maximumPlayers() { return this.maximumPlayers_; }

    // Gets the minimum number of players who need to be online to participate in this game.
    get minimumPlayers() { return this.minimumPlayers_; }

    // Gets the price for which someone can participate in this minigame.
    get price() { return this.price_; }

    // Gets the tick rate at which the game will receive lifetime events.
    get tick() { return this.tick_; }

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
            if (typeof options.command !== 'string' || !options.command.length)
                throw new Error(`[${this.name_}] The game's command must be given as a string.`);
            
            this.command_ = options.command;
        }

        if (options.hasOwnProperty('maximumPlayers')) {
            if (typeof options.maximumPlayers !== 'number' ||
                    !Number.isSafeInteger(options.maximumPlayers)) {
                throw new Error(`[${this.name_}] The maximum player count must be a number.`);
            }
            
            this.maximumPlayers_ = options.maximumPlayers;
        }

        if (options.hasOwnProperty('minimumPlayers')) {
            if (typeof options.minimumPlayers !== 'number' ||
                    !Number.isSafeInteger(options.minimumPlayers)) {
                throw new Error(`[${this.name_}] The minimum player count must be a number.`);
            }
            
            this.minimumPlayers_ = options.minimumPlayers;
        }

        if (options.hasOwnProperty('price')) {
            if (typeof options.price !== 'number' || !Number.isSafeInteger(options.price))
                throw new Error(`[${this.name_}] The game's price must be given as a number.`);
            
            this.price_ = options.price;
        }

        if (options.hasOwnProperty('tick')) {
            if (typeof options.tick !== 'number' || !Number.isSafeInteger(options.tick))
                throw new Error(`[${this.name_}] The game's tick must be given as a number.`);
            
            this.tick_ = options.tick;
        }
    }
}
