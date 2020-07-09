// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Feature } from 'components/feature_manager/feature.js';
import { FightGame } from 'features/fights/fight_game.js';
import { FightRegistry } from 'features/fights/fight_registry.js';
import { Setting } from 'entities/setting.js';

// The Fights infrastructure powers games intended for players to have matches with each other. It
// ranges from 1-on-1 fights, to free-for-all games and team battles. Uses the DeathmatchGame base
// for most functionality, with custom maps on top of that.
export default class Fights extends Feature {
    games_ = null;
    registry_ = null;
    settings_ = null;

    constructor() {
        super();

        // Depend on the deathmatch specialization for games, which powers these features.
        this.games_ = this.defineDependency('games_deathmatch');
        this.games_.addReloadObserver(this, () => this.registerFightingGames());

        // Various parts of the fighting system are configurable through "/lvp settings".
        this.settings_ = this.defineDependency('settings');

        // Has knowledge of the locations and commands (+presets) of games that are available on the
        // server. Will be immediately initialized, even for tests.
        this.registry_ = new FightRegistry(this.games_);
        this.registry_.initialize();

        // Register all games known to this feature when the Settings feature has been loaded, as
        // we depend on a number of settings in order to be able to initialize the feature.
        this.settings_().ready.then(() => this.registerFightingGames());
    }

    // Registers the fighting games available on Las Venturas Playground. Each is represented by a
    // DeathmatchGame class with an object to specialize behaviour. The minimum number of players
    // for a fight is configurable through "/lvp settings", primarily for testing purposes.
    registerFightingGames() {
        const defaultLocation = this.settings_().getValue('games/fight_default_location');
        const minimumPlayers = this.settings_().getValue('games/fight_minimum_players');

        this.games_().registerGame(FightGame, {
            name: Fights.prototype.composeGameName.bind(this),
            goal: 'Defeat all other players to win the fight.',
            command: 'match',

            minimumPlayers,
            maximumPlayers: 16,

            settings: [
                // Option: Name (internal, string)
                new Setting('internal', 'name', Setting.TYPE_STRING, null, 'Display name'),

                // Option: Location (string)
                new Setting(
                    'fights', 'location', [ ...this.registry_.locations.keys() ], defaultLocation,
                    'Location'),

                // Option: Pickups (boolean)
                new Setting('fights', 'pickups', Setting.TYPE_BOOLEAN, true, 'Pickups'),
            ],

        }, this.registry_);
    }

    // Composes the display name of the fighting game that's about to be started. This should be set
    // in the internal values for predefined games, but will otherwise be composed of the settings
    // that the game is being started with.
    composeGameName(settings) {
        const kSettingLagCompensation = 'deathmatch/lag_compensation';
        const kSettingName = 'internal/name';

        const base = settings.get(kSettingName) ?? 'Deathmatch Fight';

        let suffix = '';

        // (1) Specialize the name if the |settings| will disable lag compensation.
        if (settings.has(kSettingLagCompensation) && !settings.get(kSettingLagCompensation))
            suffix = ' (lag shot)';

        return base + suffix;
    }

    dispose() {
        this.registry_.dispose();
        this.registry_ = null;

        this.games_().removeGame(FightGame);

        this.settings_ = null;

        this.games_.removeReloadObserver(this);
        this.games_ = null;
    }
}
