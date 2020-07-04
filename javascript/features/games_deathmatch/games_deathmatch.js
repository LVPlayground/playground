// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { DeathmatchDescription } from 'features/games_deathmatch/deathmatch_description.js';
import { Feature } from 'components/feature_manager/feature.js';
import { Setting } from 'entities/setting.js';

import { clone } from 'base/clone.js';

// Determines if the given |gameConstructor| has a class named "DeathmatchGame" in its prototype
// chain. We cannot use `isPrototypeOf` here, since the actual instances might be subtly different
// when live reload has been used on the server.
function hasDeathmatchGameInPrototype(gameConstructor) {
    let currentConstructor = gameConstructor;
    while (currentConstructor.name && currentConstructor.name !== 'DeathmatchGame')
        currentConstructor = currentConstructor.__proto__;

    return currentConstructor.name === 'DeathmatchGame';
}

// Feature class for the GamesDeathmatch feature, which adds a deathmatch layer of functionality on
// top of the common Games API. The public API of this feature is identical to that offered by the
// Games class, but with additional verification and preparation in place.
export default class GamesDeathmatch extends Feature {
    gameConstructors_ = new Map();

    games_ = null;
    settings_ = null;

    constructor() {
        super();

        // This feature is a layer on top of the Games feature, which provides core functionality.
        this.games_ = this.defineDependency('games');
        this.games_.addReloadObserver(this, () => this.registerGames());

        // Various aspects of the games framework are configurable through `/lvp settings`.
        this.settings_ = this.defineDependency('settings');
    }

    // ---------------------------------------------------------------------------------------------

    // Registers the given |gameConstructor|, which will power the game declaratively defined in the
    // |options| dictionary. An overview of the available |options| is available in README.md.
    registerGame(gameConstructor, options, userData = null) {
        if (!hasDeathmatchGameInPrototype(gameConstructor))
            throw new Error(`The given |gameConstructor| must extend the DeathmatchGame class.`);

        const amendedOptions = clone(options);

        // Construct a `DeathmatchDescription` instance to verify the |options|. This will throw an
        // exception when it fails, informing the caller of the issue.
        const description = new DeathmatchDescription(/* description= */ null, options);

        // Store the |gameConstructor| so that we can silently reload all the games when the Games
        // feature reloads. Each user of this class wouldn't necessarily be aware of that.
        this.gameConstructors_.set(gameConstructor, { options, userData });

        // Add the settings to the |options| with default values sourced from the |description|. The
        // stored options for re-registering games after reloading will refer to the original ones.
        if (!amendedOptions.hasOwnProperty('settings'))
            amendedOptions.settings = [];
        
        amendedOptions.settings.push(
            // Option: Lag compensation (boolean)
            new Setting(
                'deathmatch', 'lag_compensation', Setting.TYPE_BOOLEAN, description.lagCompensation,
                'Lag compensation'),
        );

        return this.games_().registerGame(gameConstructor, amendedOptions, userData);
    }

    // Starts the |gameConstructor| game for the |player|, which must have been registered with the
    // game registry already. When set, the |custom| flag will enable the player to customize the
    // game's settings when available. Optionally the |registrationId| may be given as well.
    startGame(gameConstructor, player, custom = false, registrationId = null) {
        return this.games_().startGame(gameConstructor, player, custom, registrationId);
    }

    // Removes the game previously registered with |gameConstructor| from the list of games that
    // are available on the server. In-progress games will be stopped immediately.
    removeGame(gameConstructor) {
        if (!this.gameConstructors_.has(gameConstructor))
            throw new Error(`The given |gameConstructor| is not known to this feature.`);

        this.gameConstructors_.delete(gameConstructor);

        return this.games_().removeGame(gameConstructor);
    }

    // ---------------------------------------------------------------------------------------------

    // Re-registers all known games with the Games feature, which has been reloaded. This way the
    // individual deathmatch games do not have to observe multiple features.
    registerGames() {
        for (const [ gameConstructor, { options, userData } ] of this.gameConstructors_)
            this.registerGame(gameConstructor, options, userData);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        for (const gameConstructor of this.gameConstructors_.keys())
            this.games_().removeGame(gameConstructor);

        this.gameConstructors_.clear();
        this.gameConstructors_ = null;

        this.settings_ = null;

        this.games_.removeReloadObserver(this);
        this.games_ = null;
    }
}
