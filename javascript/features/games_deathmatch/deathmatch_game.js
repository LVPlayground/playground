// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Color } from 'base/color.js';
import { DeathmatchPlayerState } from 'features/games_deathmatch/deathmatch_player_state.js';
import { Game } from 'features/games/game.js';

// Colours that will be assigned to participants of certain teams.
const kTeamColorAlpha = Color.fromHex('D84315AA');  // red
const kTeamColorBravo = Color.fromHex('0277BDAA');  // blue

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

    // Map of Player instance to DeathmatchPlayerState instance for all participants.
    #state_ = new Map();

    // ---------------------------------------------------------------------------------------------

    // Gets or sets the mode that the deathmatch game is currently running under.
    get mode() { return this.#mode_; }
    set mode(value) { this.#mode_ = value; }

    // Returns a PlayerStatsView instance for the current statistics of the given |player|. An
    // exception will be thrown if the |player| has not had their state initialized yet.
    getStatisticsForPlayer(player) {
        const state = this.#state_.get(player);
        if (!state || !state.statistics)
            throw new Error(`The given player (${player}) isn't part of this game anymore.`);

        return player.stats.diff(state.statistics);
    }

    // Gets the team that the given |player| is part of. Will be one of the DeathmatchGame.kTeam*
    // constants, and always be kTeamIndividual for non-team based games.
    getTeamForPlayer(player) {
        if (this.#mode_ === DeathmatchGame.kModeIndividual)
            return DeathmatchGame.kTeamIndividual;
        
        const state = this.#state_.get(player);
        if (!state || state.team === null)
            throw new Error(`The given player (${player}) has not been assigned a team yet.`);

        return state.team;
    }

    // Sets the team for the given |player| to |team|. This will throw an exception on invalid teams
    // or when setting teams in non-team based games. Team settings will immediately be applied.
    setTeamForPlayer(player, team) {
        if (this.#mode_ !== DeathmatchGame.kModeTeams)
            throw new Error(`Cannot set a player's team in non-team based games.`);

        if (![ DeathmatchGame.kTeamAlpha, DeathmatchGame.kTeamBravo ].includes(team))
            throw new Error(`Cannot set a player's team to an invalid team.`);

        const state = this.#state_.get(player);
        if (!state)
            throw new Error(`The given player (${player}) isn't part of this game anymore.`);

        state.team = team;

        this.applyTeamColorSettingForPlayer(player);
        this.applyTeamDamageSettingForPlayer(player);

        // Has to be executed *after* applying team colours.
        this.applyMapMarkerSettingForPlayer(player);
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

    // Called when the given |player| is being added to the game. We prepare their de facto state,
    // and get them in order before they're going to spawn in the game's world.
    async onPlayerAdded(player) {
        await super.onPlayerAdded(player);

        // Initialize and store the |player|'s current state.
        this.#state_.set(player, new DeathmatchPlayerState(player));

        // Disable lag compensation for the |player| when this has been configured.
        if (!this.#lagCompensation_)
            player.syncedData.lagCompensationMode = /* disabled= */ 0;
        
        // For free-for-all games, this is the point where map marker visibility will be decided.
        // For team-based games, it will be done when the player's assigned a team instead.
        if (this.mode === DeathmatchGame.kModeIndividual)
            this.applyMapMarkerSettingForPlayer(player);
    }

    // Called when the given |player| has been removed from the game, either because they've lost,
    // they executed the "/leave" command, or because they disconnected from the server.
    async onPlayerRemoved(player) {
        await super.onPlayerRemoved(player);

        // Reset the modified state for each of the game settings back to their original values for
        // the given |player|. This makes sure we don't permanently alter their state.
        this.resetMapMarkerSettingForPlayer(player);
        this.resetTeamColorSettingForPlayer(player);
        this.resetTeamDamageSettingForPlayer(player);

        // Flip lag compensation back to its default value if it was modified.
        if (!this.#lagCompensation_)
            player.syncedData.lagCompensationMode = Player.kDefaultLagCompensationMode;
        
        // Finally, clear the player-specific state we had stored in this game.
        this.#state_.delete(player);
    }

    // ---------------------------------------------------------------------------------------------
    // Section: Map markers
    // ---------------------------------------------------------------------------------------------

    // Applies the map marker setting for the given |player|. It has three modes, either enabled for
    // all (default), enabled for team only, and disabled for everyone.
    applyMapMarkerSettingForPlayer(player) {
        const state = this.#state_.get(player);

        const invisiblePlayers = [];
        const visiblePlayers = [];

        // (1) Divide the participants in two lists: those which should be visible for the |player|,
        // and those who should be invisible to the player.
        switch (this.#mapMarkers_) {
            case DeathmatchGame.kMapMarkersEnabled:
                return;  // nothing to update

            case DeathmatchGame.kMapMarkersEnabledTeam:
                for (const [ target, targetState ] of this.#state_) {
                    if (state.team === targetState.team)
                        visiblePlayers.push({ target, targetState });
                    else
                        invisiblePlayers.push({ target, targetState });
                }
                break;

            case DeathmatchGame.kMapMarkersDisabled:
                for (const [ target, targetState ] of this.#state_)
                    invisiblePlayers.push({ target, targetState });

                break;
        }

        // (2) Make sure that the |player| is invisible to those who can't see them.
        for (const { target, targetState } of invisiblePlayers) {
            if (!state.invisible.has(target)) {
                this.makeTargetInvisibleForPlayer(player, target, state.color);
                state.invisible.add(target);
            }

            if (!targetState.invisible.has(player)) {
                this.makeTargetInvisibleForPlayer(target, player, targetState.color);
                targetState.invisible.add(player);
            }
        }

        // (3) Make sure that the |player| is visible to those who are able to see them.
        for (const { target, targetState } of visiblePlayers) {
            if (state.invisible.has(target)) {
                this.makeTargetVisibleForPlayer(player, target, state.color);
                state.invisible.delete(target);
            }

            if (targetState.invisible.has(player)) {
                this.makeTargetVisibleForPlayer(target, player, targetState.color);
                targetState.invisible.delete(player);
            }
        }
    }

    // Makes the given |target| invisible for the given |player|.
    makeTargetInvisibleForPlayer(player, target, playerColor) {
        player.setColorForPlayer(target, playerColor.withAlpha(0));
        player.toggleVisibilityToPlayer(target, /* visible= */ false);
    }

    // Makes the given |target| visible again for the given |player|. The player's |color| can be
    // re-set as well, but this could be skipped when the |player| leaves the minigame.
    makeTargetVisibleForPlayer(player, target, playerColor = null) {
        if (playerColor !== null)
            player.setColorForPlayer(target, playerColor);

        player.toggleVisibilityToPlayer(target, /* visible= */ true);
    }

    // Resets the map marker settings for the |player| as they are leaving the game. We the list of
    // participants and reset visibility for any invisible players.
    resetMapMarkerSettingForPlayer(player) {
        const state = this.#state_.get(player);

        for (const [ target, targetState ] of this.#state_) {
            if (state.invisible.has(target)) {
                this.makeTargetVisibleForPlayer(player, target);
                state.invisible.delete(target);
            }

            if (targetState.invisible.has(player)) {
                this.makeTargetVisibleForPlayer(target, player);
                targetState.invisible.delete(player);
            }
        }
    }

    // ---------------------------------------------------------------------------------------------
    // Section: Team color
    // ---------------------------------------------------------------------------------------------

    // Applies the team colour setting for the given |player|. This makes sure that all players who
    // are part of the same team, get either a red or a blue colour assigned to them.
    applyTeamColorSettingForPlayer(player) {
        const state = this.#state_.get(player);
        if (!state || state.team === null)
            return;  // the player didn't have a team colour applied

        // (1) Determine which colour the |player| should be given based on their team.
        if (state.team === DeathmatchGame.kTeamAlpha)
            state.color = kTeamColorAlpha;
        else if (state.team === DeathmatchGame.kTeamBravo)
            state.color = kTeamColorBravo;

        // (2) Apply the renewed color to the |player|'s character.
        player.color = state.color;
    }

    // Resets the |player|'s color back to what it was. We always re-set their color, as markers may
    // also amend the |player|'s color and we shouldn't re-set it twice.
    resetTeamColorSettingForPlayer(player) {
        const state = this.#state_.get(player);
        if (state)
            player.color = state.originalColor;
    }

    // ---------------------------------------------------------------------------------------------
    // Section: Team damage
    // ---------------------------------------------------------------------------------------------

    // Applies the team damage setting for the given |player|. This is achieved by putting them in
    // the same team as everyone else they're playing with, when damage should be void.
    applyTeamDamageSettingForPlayer(player) {
        const state = this.#state_.get(player);
        if (state && state.team !== null && !this.#teamDamage_)
            player.team = state.team;
    }

    // Resets the |player|'s team back to what it was before the game started, in case it was
    // modified per the game's settings - to enable voiding team damage.
    resetTeamDamageSettingForPlayer(player) {
        const state = this.#state_.get(player);
        if (state && state.team !== null && !this.#teamDamage_)
            player.team = state.originalTeam;
    }
}
