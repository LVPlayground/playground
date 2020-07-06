// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { EnvironmentSettings } from 'features/games/environment_settings.js';
import { Setting } from 'entities/setting.js';
import { Vector } from 'base/vector.js';

import { format } from 'base/format.js';
import { formatTime } from 'base/time.js';

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
    // Types of scores that a game can indicate.
    static kScoreNumber = 0;
    static kScoreTime = 1;

    gameConstructor_ = null;
    options_ = null;
    userData_ = null;

    name_ = null;
    goal_ = null;

    countdown_ = null;
    countdownCamera_ = null;
    countdownView_ = null;

    command_ = null;
    continuous_ = false;
    environment_ = null;
    maximumPlayers_ = kDefaultMaximumPlayers;
    minimumPlayers_ = kDefaultMinimumPlayers;
    price_ = kDefaultPrice;
    scoreType_ = GameDescription.kScoreNumber;
    tick_ = kDefaultTickIntervalMs;

    settings_ = new Map();
    settingsValidator_ = null;

    // ---------------------------------------------------------------------------------------------

    // Gets the constructor which can be used to instantiate the game.
    get gameConstructor() { return this.gameConstructor_; }

    // Gets the unprocessed options that were used for initializing this game.
    get options() { return this.options_; }

    // Gets the user data passed when the game was registered with this feature.
    get userData() { return this.userData_; }

    // ---------------------------------------------------------------------------------------------
    // Required configuration
    // ---------------------------------------------------------------------------------------------

    // Gets the name of this game.
    get name() { return this.name_(new Map()); }

    // Gets the function that can be used to generate the name with custom settings.
    get nameFn() { return this.name_; }

    // Gets the explanation of the game's goal. What should players be doing?
    get goal() { return this.goal_; }

    // ---------------------------------------------------------------------------------------------
    // Optional configuration: countdown
    // ---------------------------------------------------------------------------------------------

    // Gets the time, in seconds, for which a countdown screen should be displayed.
    get countdown() { return this.countdown_; }

    // Gets the position vectors of the camera during the countdown. (From -> To)
    get countdownCamera() { return this.countdownCamera_; }

    // Gets the target, the view of the camera during the countdown. (From -> To)
    get countdownView() { return this.countdownView_; }

    // ---------------------------------------------------------------------------------------------
    // Optional configuration: environment
    // ---------------------------------------------------------------------------------------------

    // Gets the environment that should be applied to this game by default.
    get environment() { return this.environment_; }

    // ---------------------------------------------------------------------------------------------
    // Optional configuration: settings
    // ---------------------------------------------------------------------------------------------

    // Gets a map of the settings that can be configured for this game.
    get settings() { return this.settings_; }

    // Gets the function, if any, which should be used to validate a custom setting.
    get settingsValidator() { return this.settingsValidator_; }

    // ---------------------------------------------------------------------------------------------
    // Optional configuration: misc
    // ---------------------------------------------------------------------------------------------

    // Gets the name of the command which can be used to start the game. Optional, thus may be NULL.
    get command() { return this.command_; }

    // Gets whether this is a continuous game, rather than one that requires sign-up.
    get continuous() { return this.continuous_; }

    // Gets the maximum number of players who can participate in this game.
    get maximumPlayers() { return this.maximumPlayers_; }

    // Gets the minimum number of players who need to be online to participate in this game.
    get minimumPlayers() { return this.minimumPlayers_; }

    // Gets the price for which someone can participate in this minigame.
    get price() { return this.price_; }

    // Returns whether this minigame is free to play, which some continuous games might want to be.
    isFree() { return this.price_ === 0; }

    // Gets the tick rate at which the game will receive lifetime events.
    get tick() { return this.tick_; }

    // ---------------------------------------------------------------------------------------------

    // Formats the given |score| per the guidelines configured for this game. The return value of
    // this function must finish the sentence: "finished the Haystack game"...
    formatScore(score) {
        switch (this.scoreType_) {
            case GameDescription.kScoreNumber:
                return format('with a score of %d', score);
            
            case GameDescription.kScoreTime:
                if (score === 1)
                    return 'in one second';
                else if (score < 60)
                    return format('in %d seconds', score);
                else if (score < 3600)
                    return 'in ' + formatTime(score).replace(/^0/, '') + ' minutes';
                else if (score < 24 * 3600)
                    return 'in ' + formatTime(score).substring(0, 5).replace(/^0/, '') + ' hours';
                else
                    return 'in a silly amount of time';
        }

        return 'unknown score';
    }

    // ---------------------------------------------------------------------------------------------

    constructor(gameConstructor, options, userData) {
        if (!hasGameInPrototype(gameConstructor))
            throw new Error('Each game must override the `Game` base class in this feature.');

        this.gameConstructor_ = gameConstructor;
        this.options_ = options;
        this.userData_ = userData;
        
        // -----------------------------------------------------------------------------------------
        // Section: required options
        // -----------------------------------------------------------------------------------------

        if (!options.hasOwnProperty('name') || !['function','string'].includes(typeof options.name))
            throw new Error('Each game must indicate its name as a function or a string.');

        this.name_ = typeof options.name === 'string' ? () => options.name
                                                      : options.name;

        if (!options.hasOwnProperty('goal') || typeof options.goal !== 'string')
            throw new Error('Each game must indicate a the game\'s goal as a string.');

        this.goal_ = options.goal;

        // -----------------------------------------------------------------------------------------
        // Section: optional settings configuration
        // -----------------------------------------------------------------------------------------

        if (options.hasOwnProperty('settings')) {
            if (!Array.isArray(options.settings))
                throw new Error(`[${this.name}] The game's settings must be given as an array.`);
            
            for (const setting of options.settings) {
                if (!(setting instanceof Setting))
                    throw new Error(`[${this.name}] Each setting must be a Setting instance.`);
                
                if (this.settings_.has(setting.identifier))
                    throw new Error(`[${this.name}] Setting ${setting.identifier} already exists.`)
                
                this.settings_.set(setting.identifier, setting);
            }

            if (options.hasOwnProperty('settingsValidator')) {
                if (typeof options.settingsValidator !== 'function')
                    throw new Error(`[${this.name}] The setting validator must be a function.`);
                
                this.settingsValidator_ = options.settingsValidator;
            }
        }

        // -----------------------------------------------------------------------------------------
        // Section: optional countdown configuration
        // -----------------------------------------------------------------------------------------

        if (options.hasOwnProperty('countdown')) {
            if (typeof options.countdown !== 'number' || !Number.isSafeInteger(options.countdown))
                throw new Error(`[${this.name}] The game's countdown must be given as a number.`);
            
            this.countdown_ = options.countdown;

            if (!options.hasOwnProperty('countdownCamera'))
                throw new Error(`[${this.name}] The camera position is required for a countdown.`);

            if (!Array.isArray(options.countdownCamera) || options.countdownCamera.length != 2) {
                throw new Error(
                    `[${this.name}] The camera position must be an array with two Vectors.`);
            }
            
            if (!(options.countdownCamera[0] instanceof Vector) ||
                    !(options.countdownCamera[1] instanceof Vector)) {
                throw new Error(`[${this.name}] Each camera position must be a [x, y, z] Vector.`)
            }

            this.countdownCamera_ = options.countdownCamera;

            if (!options.hasOwnProperty('countdownView'))
                throw new Error(`[${this.name}] The camera view is required for a countdown.`);

            if (!Array.isArray(options.countdownView) || options.countdownView.length != 2) {
                throw new Error(
                    `[${this.name}] The camera view must be an array with two Vectors.`);
            }
            
            if (!(options.countdownView[0] instanceof Vector) ||
                    !(options.countdownView[1] instanceof Vector)) {
                throw new Error(`[${this.name}] Each camera view must be a [x, y, z] Vector.`)
            }

            this.countdownView_ = options.countdownView;
        }

        // -----------------------------------------------------------------------------------------
        // Section: optional environment configuration
        // -----------------------------------------------------------------------------------------

        // Default environment configuration, can be overridden by the configuration.
        const environment = {
            time: 'Afternoon',
            weather: 'Sunny',
            gravity: 'Normal',
        };

        if (options.hasOwnProperty('environment')) {
            if (typeof options.environment !== 'object')
                throw new Error(`[${this.name}] The game's environment must be an object.`);

            if (options.environment.hasOwnProperty('time')) {
                if (!EnvironmentSettings.kTimeOptions.includes(options.environment.time))
                    throw new Error(`[${this.name}] Invalid value for the environment's time`);
                
                environment.time = options.environment.time;
            }

            if (options.environment.hasOwnProperty('weather')) {
                if (!EnvironmentSettings.kWeatherOptions.includes(options.environment.weather))
                    throw new Error(`[${this.name}] Invalid value for the environment's weather`);
                
                environment.weather = options.environment.weather;
            }

            if (options.environment.hasOwnProperty('gravity')) {
                if (!EnvironmentSettings.kGravityOptions.includes(options.environment.gravity))
                    throw new Error(`[${this.name}] Invalid value for the environment's gravity`);
                
                environment.gravity = options.environment.gravity;
            }
        }

        this.environment_ = environment;

        // -----------------------------------------------------------------------------------------
        // Section: optional options
        // -----------------------------------------------------------------------------------------

        if (options.hasOwnProperty('command')) {
            if (typeof options.command !== 'string' || !options.command.length)
                throw new Error(`[${this.name}] The game's command must be given as a string.`);
            
            this.command_ = options.command;
        }

        if (options.hasOwnProperty('continuous')) {
            if (typeof options.continuous !== 'boolean')
                throw new Error(`[${this.name}] The game's continuous flag must be a boolean.`);
            
            this.continuous_ = options.continuous;
        }

        if (options.hasOwnProperty('maximumPlayers')) {
            if (typeof options.maximumPlayers !== 'number' ||
                    !Number.isSafeInteger(options.maximumPlayers)) {
                throw new Error(`[${this.name}] The maximum player count must be a number.`);
            }
            
            this.maximumPlayers_ = options.maximumPlayers;
        }

        if (options.hasOwnProperty('minimumPlayers')) {
            if (typeof options.minimumPlayers !== 'number' ||
                    !Number.isSafeInteger(options.minimumPlayers)) {
                throw new Error(`[${this.name}] The minimum player count must be a number.`);
            }
            
            this.minimumPlayers_ = options.minimumPlayers;
        }

        if (options.hasOwnProperty('price')) {
            if (typeof options.price !== 'number' || !Number.isSafeInteger(options.price))
                throw new Error(`[${this.name}] The game's price must be given as a number.`);
            
            this.price_ = options.price;
        }

        if (options.hasOwnProperty('scoreType')) {
            const mapping = {
                number: GameDescription.kScoreNumber,
                time: GameDescription.kScoreTime,
            };

            if (!mapping.hasOwnProperty(options.scoreType)) {
                throw new Error(`[${this.name}] The game's score type must be one of: ` +
                                Object.keys(mapping).sort().join(', '));
            }

            this.scoreType_ = mapping[options.scoreType];
        }

        if (options.hasOwnProperty('tick')) {
            if (typeof options.tick !== 'number' || !Number.isSafeInteger(options.tick))
                throw new Error(`[${this.name}] The game's tick must be given as a number.`);
            
            this.tick_ = options.tick;
        }

        // -----------------------------------------------------------------------------------------
        // Section: combinational validation
        // -----------------------------------------------------------------------------------------

        if (this.continuous_ && this.minimumPlayers_ >= 2)
            throw new Error(`[${this.name}] Continuous games must accept single participants.`);
    }
}
