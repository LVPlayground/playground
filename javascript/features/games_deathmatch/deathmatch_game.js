// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Game } from 'features/games/game.js';

// Implementation of the `Game` interface which extends it with deathmatch-related functionality. It
// exposes methods that should be called before game-specific behaviour, i.e. through super calls.
export class DeathmatchGame extends Game {
    // Values for map marker visibility for the participants.
    static kMapMarkersEnabled = 0;
    static kMapMarkersEnabledTeam = 1;
    static kMapMarkersDisabled = 2;

    // Mode of the game, either free-for-all or team-based.
    static kModeIndividual = 0;
    static kModeTeams = 1;

    // Indicates which team a player can be part of. Individuals are always part of team 0, whereas
    // players can be part of either Team Alpha or Team Bravo in team-based games.
    static kTeamIndividual = 0;
    static kTeamAlpha = 0;
    static kTeamBravo = 1;

    #lagCompensation_ = null;
    #mapMarkers_ = DeathmatchGame.kMapMarkersEnabled;
    #mode_ = DeathmatchGame.kModeIndividual;
    #teamDamage_ = null;

    // Snapshots of statistics of each of the participants when they join the game.
    #statistics_ = new WeakMap();

    // Team ID of the team that a given player is part of.
    #teams_ = new Map();

    // ---------------------------------------------------------------------------------------------

    // Gets or sets the mode that the deathmatch game is currently running under.
    get mode() { return this.#mode_; }
    set mode(value) { this.#mode_ = value; }

    // Returns a PlayerStatsView instance for the current statistics of the given |player|, or NULL
    // when the |player| is not currently engaged in the game.
    getStatisticsForPlayer(player) {
        const snapshot = this.#statistics_.get(player);
        if (!snapshot)
            return null;  // no snapshot could be found

        return player.stats.diff(snapshot);
    }

    // Gets the team that the given |player| is part of. Will be one of the DeathmatchGame.kTeam*
    // constants, and always be kTeamIndividual for non-team based games.
    getTeamForPlayer(player) {
        if (this.#mode_ === DeathmatchGame.kModeIndividual)
            return DeathmatchGame.kTeamIndividual;
        
        if (!this.#teams_.has(player))
            throw new Error(`The given player (${player}) has not been assigned a team yet.`);

        return this.#teams_.get(player);
    }

    // Sets the team for the given |player| to |team|. This will throw an exception on invalid teams
    // or when setting teams in non-team based games. Team settings will immediately be applied.
    setTeamForPlayer(player, team) {
        if (this.#mode_ !== DeathmatchGame.kModeTeams)
            throw new Error(`Cannot set a player's team in non-team based games.`);

        if (![ DeathmatchGame.kTeamAlpha, DeathmatchGame.kTeamBravo ].includes(team))
            throw new Error(`Cannot set a player's team to an invalid team.`);

        this.#teams_.set(player, team);
        this.enableTeamStateForPlayer(player);
    }

    // ---------------------------------------------------------------------------------------------

    async onInitialized(settings) {
        await super.onInitialized(settings);

        // Import the settings from the |settings|, which may have been customised by the player.
        this.#lagCompensation_ = settings.get('deathmatch/lag_compensation');
        this.#teamDamage_ = settings.get('deathmatch/team_damage');

        switch (settings.get('deathmatch/map_markers')) {
            case 'Enabled':
                this.#mapMarkers_ = DeathmatchGame.kMapMarkersEnabled;
                break;

            case 'Team only':
                this.#mapMarkers_ = DeathmatchGame.kMapMarkersEnabledTeam;
                break;

            case 'Disabled':
                this.#mapMarkers_ = DeathmatchGame.kMapMarkersDisabled;
                break;

            default:
                throw new Error(`Invalid value given for map markers.`);
        }
    }

    async onPlayerAdded(player) {
        await super.onPlayerAdded(player);

        this.#statistics_.set(player, player.stats.snapshot());

        if (!this.#lagCompensation_)
            player.syncedData.lagCompensationMode = /* disabled= */ 0;
        
        // For free-for-all games, this is the point where we apply team & visibility state.
        if (this.mode === DeathmatchGame.kModeIndividual)
            this.enableTeamStateForPlayer(player);
    }

    async onPlayerRemoved(player) {
        await super.onPlayerRemoved(player);

        this.clearTeamStateForPlayer(player);

        this.#statistics_.delete(player);
        this.#teams_.delete(player);

        if (!this.#lagCompensation_)
            player.syncedData.lagCompensationMode = Player.kDefaultLagCompensationMode;
    }

    // ---------------------------------------------------------------------------------------------

    // Enables the team-specific state for the given |player|. This can be called multiple times,
    // and will ensure that all settings for the |player| are synchronized to others.
    enableTeamStateForPlayer(player) {
        // TODO: Map marker visibility
        // TODO: Player team settings
    }

    // Disables the team-specific state for the given |player|. This will reset the team that they
    // are part of when damage has been disabled, clean up marker state, etecetera.
    clearTeamStateForPlayer(player) {
        // TODO: Map marker visibility
        // TODO: Player team settings
    }
}
