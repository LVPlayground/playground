// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Feature } from 'components/feature_manager/feature.js';

// Determines if the given |gameConstructor| has a class named "VehicleGame" in its prototype
// chain. We cannot use `isPrototypeOf` here, since the actual instances might be subtly different
// when live reload has been used on the server.
function hasVehicleGameInPrototype(gameConstructor) {
    let currentConstructor = gameConstructor;
    while (currentConstructor.name && currentConstructor.name !== 'VehicleGame')
        currentConstructor = currentConstructor.__proto__;

    return currentConstructor.name === 'VehicleGame';
}

// Feature class for the GamesVehicles feature, which adds a vehicle-based layer of functionality on
// top of the common Games API. The public API of this feature is identical to that offered by the
// Games class, but with additional verification and preparation in place.
export default class GamesVehicles extends Feature {
    gameConstructors_ = new Map();
    games_ = null;

    constructor() {
        super();

        // Vehicles games are common to the server, thus this is a low-level feature.
        this.markLowLevel();

        // This feature is a layer on top of the Games feature, which provides core functionality.
        this.games_ = this.defineDependency('games');
        this.games_.addReloadObserver(this, () => this.registerGames());
    }

    // ---------------------------------------------------------------------------------------------

    // Registers the given |gameConstructor|, which will power the game declaratively defined in the
    // |options| dictionary. An overview of the available |options| is available in README.md.
    registerGame(gameConstructor, options, userData = null) {
        if (!hasVehicleGameInPrototype(gameConstructor))
            throw new Error(`The given |gameConstructor| must extend the VehicleGame class.`);

        // Store the |gameConstructor| so that we can silently reload all the games when the Games
        // feature reloads. Each user of this class wouldn't necessarily be aware of that.
        this.gameConstructors_.set(gameConstructor, { options, userData });

         // Now register the |gameConstructor| with the regular Games API.
        return this.games_().registerGame(gameConstructor, options, userData);
    }

    // Execute the game command for the given |gameConstructor| for the given |player|. What happens
    // will be defined by the |params| property, which must be a GameCommandParams instance.
    executeGameCommand(gameConstructor, player, params) {
        return this.games_().executeGameCommand(gameConstructor, player, params);
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
    // individual vehicle games do not have to observe multiple features.
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

        this.games_.removeReloadObserver(this);
        this.games_ = null;
    }
}
