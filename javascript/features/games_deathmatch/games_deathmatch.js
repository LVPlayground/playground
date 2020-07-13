// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { DeathmatchDescription } from 'features/games_deathmatch/deathmatch_description.js';
import { Feature } from 'components/feature_manager/feature.js';
import { ObjectiveSetting } from 'features/games_deathmatch/settings/objective_setting.js';
import { Setting } from 'entities/setting.js';
import { SpawnWeaponsSetting } from 'features/games_deathmatch/settings/spawn_weapons_setting.js';

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

        // Construct a `DeathmatchDescription` instance to verify the |options|. This will throw an
        // exception when it fails, informing the caller of the issue.
        const description = new DeathmatchDescription(
            /* description= */ null, options, this.settings_());

        // Store the |gameConstructor| so that we can silently reload all the games when the Games
        // feature reloads. Each user of this class wouldn't necessarily be aware of that.
        this.gameConstructors_.set(gameConstructor, { options, userData });

        // Settings made available by the GamesDeathmatch API.
        const settings = [
            // Option: Lag compensation (boolean)
            new Setting(
                'deathmatch', 'lag_compensation', Setting.TYPE_BOOLEAN, description.lagCompensation,
                'Lag compensation'),
            
            // Option: Map markers (enumeration)
            new Setting(
                'deathmatch', 'map_markers', DeathmatchDescription.kMapMarkerOptions,
                description.mapMarkers, 'Map markers'),
            
            // Option: Objective (complex)
            new Setting(
                'deathmatch', 'objective', new ObjectiveSetting(), description.objective,
                'Objective'),

            // Option: Skin (number, hidden)
            new Setting('deathmatch', 'skin', Setting.TYPE_NUMBER, description.skin, 'Skin'),

            // Option: Spawn armour (boolean)
            new Setting(
                'deathmatch', 'spawn_armour', Setting.TYPE_BOOLEAN, description.spawnArmour,
                'Spawn armour'),

            // Option: Spawn weapons (complex)
            new Setting(
                'deathmatch', 'spawn_weapons', new SpawnWeaponsSetting(), description.spawnWeapons,
                'Spawn weapons'),

            // Option: Teams (enumeration)
            new Setting(
                'deathmatch', 'teams', DeathmatchDescription.kTeamOptions, description.teams,
                'Teams'),

            // Option: Team damage (boolean)
            new Setting(
                'deathmatch', 'team_damage', Setting.TYPE_BOOLEAN, description.teamDamage,
                'Team damage'),
        ]

        // Inject each of the settings in |options|. This is an O(n^2) operation, but given that
        // there won't be more than ten options or so and registering a new game is extremely rare,
        // we'll go with it. Could be optimized by creating an existing setting map first.
        if (!options.hasOwnProperty('settings') || !Array.isArray(options.settings))
            options.settings = [];

        for (const setting of settings) {
            const identifier = setting.identifier;

            let overridden = false;
            for (let index = 0; index < options.settings.length; ++index) {
                if (options.settings[index].identifier !== identifier)
                    continue;

                // Override the existing setting with the new one. We own the deathmatch/ namespace.
                options.settings[index] = setting;

                overridden = true;
                break;
            }

            if (!overridden)
                options.settings.push(setting);
        }

        // Hide the "deathmatch/skin" option. Until we have a fancy picker for skins, this should
        // only be configurable by preconfigured minigames.
        if (!options.hasOwnProperty('settingsFrozen') || !Array.isArray(options.settingsFrozen))
            options.settingsFrozen = [];
        
        if (!options.settingsFrozen.includes('deathmatch/skin'))
            options.settingsFrozen.push('deathmatch/skin');

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
