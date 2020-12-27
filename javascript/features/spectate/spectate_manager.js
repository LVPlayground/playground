// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { SpectateGroup } from 'features/spectate/spectate_group.js';
import { SpectateState } from 'features/spectate/spectate_state.js';

import { shuffle } from 'base/shuffle.js';

// Responsible for keeping track of which players are spectating which player groups, and maintains
// the global player group through which all players can be spectated.
export class SpectateManager {
    #globalGroup_ = null;
    #monitoring_ = false;
    #settings_ = null;
    #spectating_ = null;

    constructor(settings) {
        this.#settings_ = settings;

        // Initialize the global spectate group, through which all players can be observed.
        this.#globalGroup_ = new SpectateGroup(this, SpectateGroup.kSwitchAbandonBehaviour);

        // Map keyed by Player, valued by SpectateState instances for active spectators.
        this.#spectating_ = new Map();

        server.playerManager.addObserver(this, /* replayHistory= */ true);
    }

    // ---------------------------------------------------------------------------------------------
    // Section: actual functionality
    // ---------------------------------------------------------------------------------------------

    // Called when the |player| should start spectating the given |group|, optionally starting with
    // the given |target|. All permission and ability checks should've been done already. Returns
    // whether the spectation has started, which would fail iff |target| is spectating too.
    spectate(player, group, target = null) {
        if (target && !group.hasPlayer(target))
            throw new Error(`It's not possible to spectate players not in the SpectateGroup`);

        if (!target && !group.size)
            throw new Error(`It's not possible to spectate an empty SpectateGroup.`);

        // Bail out if the |target| is spectating too. Can't spectate someone who's spectating.
        if (this.#spectating_.has(target))
            return false;

        // If no |target| was given, pick the first player in the |group|. The |player| will be able
        // to move back and forth within the group as they please.
        if (!target)
            target = [ ...group ][0];

        // Put the |player| in the same Virtual World and interior as the |target|.
        player.virtualWorld = target.virtualWorld;
        player.interiorId = target.interiorId;

        // If the |player| hasn't been put in spectator mode yet, do this now.
        if (!this.#spectating_.has(player))
            player.spectating = true;

        this.#spectating_.set(player, new SpectateState(group, target));

        // Synchronize the environment of the |player|.
        this.synchronizeEnvironment(player);

        // If the monitor isn't running yet, start it to keep player state updated.
        if (!this.#monitoring_)
            this.monitor();

        return true;
    }

    // Synchronizes the environment of the |player| with their target, to make sure that they stay
    // near each other when spectating. This includes interior and virtual world changes.
    synchronizeEnvironment(player) {
        const state = this.#spectating_.get(player);
        const target = state.target;

        // (1) The entity that the |player| is meant to be watching. If they're not, make it so.
        const targetEntity = target.vehicle ?? target;
        if (targetEntity !== state.targetEntity) {
            if (target.vehicle)
                player.spectateVehicle(target.vehicle);
            else
                player.spectatePlayer(target);
        }

        // (2) Make sure that the |player| and |targetEntity| are in the same environment.
        if (player.virtualWorld !== targetEntity.virtualWorld)
            player.virtualWorld = targetEntity.virtualWorld;

        if (player.interiorId !== targetEntity.interiorId)
            player.interiorId = targetEntity.interiorId;

        // (3) Maybe have some sort of 3D text label?
    }

    // Called when the |player| should stop spectating. This function will silently fail if they are
    // not currently spectating anyone, as there is no work to do.
    stopSpectate(player) {
        const state = this.#spectating_.get(player);
        if (!state)
            return;  // the |player| is not currently spectating

        // Clear out the |player|'s state, they won't be spectating anyone anymore.
        this.#spectating_.delete(player);

        // Move the player out of spectation mode. This will respawn them.
        player.spectating = false;
    }

    // ---------------------------------------------------------------------------------------------
    // Section: spectation monitor
    // ---------------------------------------------------------------------------------------------

    // Spins while there are players on the server who are spectating others. Will shut down when
    // the last player has stopped spectating, moving the system into idle mode.
    async monitor() {
        await wait(this.#settings_().getValue('playground/spectator_monitor_frequency_ms'));

        do {
            for (const player of this.#spectating_.keys())
                this.synchronizeEnvironment(player);

            // Wait for the configured interval before iterating in the next round.
            await wait(this.#settings_().getValue('playground/spectator_monitor_frequency_ms'));

        } while (this.#monitoring_ && this.#spectating_.size);
    }

    // ---------------------------------------------------------------------------------------------
    // Section: maintaining the global spectation group
    // ---------------------------------------------------------------------------------------------

    // Returns the global spectation group maintained by this class.
    getGlobalGroup() { return this.#globalGroup_; }

    // Called when the given |player| connects to the server. Makes sure that they're in the global
    // spectate group, so that administrators can keep an eye out on them.
    onPlayerConnect(player) {
        if (player.isNonPlayerCharacter())
            return;  // ignore non-player characters in global spectate groups

        this.#globalGroup_.addPlayer(player);
    }

    // Called when the given |player| has disconnected from the server. Removes them from the global
    // spectate group, and cleans up any remaining state if they're currently spectating someone.
    onPlayerDisconnect(player) {
        if (this.#spectating_.has(player))
            this.#spectating_.delete(player);

        this.#globalGroup_.removePlayer(player);
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the given |group| has been updated. Will have to make sure that the interface for
    // all people watching it will be updated as appropriate. The action will depend on the
    // behaviour specified in the group.
    onGroupUpdated(group) {
        for (const [ player, state ] of this.#spectating_) {
            if (state.group !== group)
                continue;  // the |player| is watching another group

            if (group.hasPlayer(state.target))
                continue;  // the |player|'s target is still part of the group

            let identifiedSolution = false;

            switch (group.abandonBehaviour) {
                case SpectateGroup.kStopAbandonBehaviour:
                    this.stopSpectate(player);
                    break;

                case SpectateGroup.kSwitchAbandonBehaviour:
                    for (const target of shuffle([ ...group ])) {
                        if (this.#spectating_.has(target))
                            continue;  // cannot spectate others who are spectating

                        identifiedSolution = true;

                        this.spectate(player, group, target);
                        break;
                    }

                    if (!identifiedSolution)
                        this.stopSpectate(player);

                    break;
            }
        }
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.playerManager.removeObserver(this);

        // Forcefully stop all current spectators from spectating. This would cause a bug for people
        // currently in between rounds in a game, but work fine in all other cases.
        for (const player of this.#spectating_.keys())
            this.stopSpectate(player);

        this.#monitoring_ = false;
        this.#settings_ = null;
    }
}
