// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CircularReadOnlyBuffer } from 'base/circular_read_only_buffer.js';
import { GameActivity } from 'features/games/game_activity.js';
import { GameRegistration } from 'features/games/game_registration.js';
import { GameRuntime } from 'features/games/game_runtime.js';
import ScopedCallbacks from 'base/scoped_callbacks.js';

import { range } from 'base/range.js';

// Virtual worlds that have been allocated to games. Boundaries, inclusive.
const kGameVirtualWorldRange = [ 115, 199 ];

// The game manager is responsible for keeping track of and managing all active games on the server-
// whether that be accepting sign-ups, or actually in progress.
export class GameManager {
    finance_ = null;
    nuwani_ = null;

    callbacks_ = null;

    // Map of |player| => GameActivity instances of a player's current activity, if any.
    activity_ = new WeakMap();

    // Set of GameRegistration instances that are currently accepting registrations, and a circular
    // read-only buffer that's able to issue registration IDs for games.
    registrationIds_ = null;
    registrations_ = new Set();

    // Set of GameRuntime instances that are currently actively running games on the server.
    runtimes_ = new Set();

    // Circular buffer that's able to sequentially issue the virtual worlds assigned to games.
    worlds_ = null;

    constructor(finance, nuwani) {
        this.finance_ = finance;
        this.nuwani_ = nuwani;

        this.callbacks_ = new ScopedCallbacks();
        this.callbacks_.addEventListener(
            'playerresolveddeath', GameManager.prototype.onPlayerDeath.bind(this));
        this.callbacks_.addEventListener(
            'playerspawn', GameManager.prototype.onPlayerSpawn.bind(this));

        this.registrationIds_ = new CircularReadOnlyBuffer(...range(1, 99));
        this.worlds_ = new CircularReadOnlyBuffer(...range(...kGameVirtualWorldRange));

        server.playerManager.addObserver(this);
    }

    // ---------------------------------------------------------------------------------------------

    // Returns the activity the |player| is engaged in as a `GameActivity` instance, if any.
    getPlayerActivity(player) { return this.activity_.get(player) || null; }

    // ---------------------------------------------------------------------------------------------

    // Starts registration for a new game of the given |description|. No announcements will be sent,
    // that's the job of whoever requested the game to be created. Will return the GameRegistration
    // instance when the request was successful, or NULL otherwise.
    createGameRegistration(description, settings, type) {
        const registrationId = this.registrationIds_.next();
        const registration = new GameRegistration(description, settings, type, registrationId, this)

        this.registrations_.add(registration);
        return registration;
    }

    // Returns an array with the pending games for the game described by |description|. Some will be
    // invite-only, while others will be available for anyone to participate in.
    getPendingGameRegistrations(description) {
        let registrationsForGame = [];

        for (const registration of this.registrations_) {
            if (registration.description === description)
                registrationsForGame.push(registration);
        }

        return registrationsForGame;
    }

    // Cancels the given |registration|, as the game will not be started because of an undefined
    // reason. All participants must have had their activities cleared already.
    cancelGameRegistration(registration) {
        this.registrations_.delete(registration);
    }

    // ---------------------------------------------------------------------------------------------

    // Runs the game described by |description| based on the given |registration| information. This
    // method will return once the game has finished again.
    async runGame(description, registration) {
        this.registrations_.delete(registration);

        // Create the |runtime| and add it to the active runtime set.
        const runtime =
            new GameRuntime(this, description, registration.settings, this.finance_, this.nuwani_,
                            this.worlds_.next());

        this.runtimes_.add(runtime);

        await runtime.initialize();

        for (const [ player, contribution ] of registration.players)
            await runtime.addPlayer(player, contribution);

        await runtime.run();
        await runtime.finalize();

        this.runtimes_.delete(runtime);
    }

    // ---------------------------------------------------------------------------------------------

    // Immediately stops all games that are either accepting sign-ups or in-progress because the
    // game described by |description| will no longer be available.
    stopAllActiveGames(description) {
        for (const player of server.playerManager) {
            const activity = this.activity_.get(player);
            if (!activity || activity.description !== description)
                continue;  // the |player| is not engaged in the |description| game

            player.sendMessage(Message.GAME_REGISTRATION_RELOAD, activity.getActivityName());

            // Refund the player's money if the game hadn't started yet, so that they are able to
            // do something else with it. If the game had started, they're out of luck.
            if (activity.getActivityState() === GameActivity.kStateRegistered) {
                const contribution = activity.getPlayerContribution(player);
                if (contribution > 0)
                    this.finance_().givePlayerCash(player, contribution);
            }

            // Force the |player| to leave the activity.
            activity.removePlayer(player);
        }
    }

    // Called when a player spawn in the world. If they're part of an engaged game, the event will
    // be owned by the game and it's expected to do something with it.
    onPlayerSpawn(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player)
            return;  // the |player| couldn't be found, this is an invalid death
        
        const activity = this.activity_.get(player);
        if (!activity || activity.getActivityState() != GameActivity.kStateEngaged)
            return;  // the |player| isn't in a game, or the game hasn't started yet
        
        activity.onPlayerSpawn(player);
    }

    // Called when a player has died, and information about the kill has been resolved. This is an
    // event coming from Pawn and therefore untrusted.
    onPlayerDeath(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player)
            return;  // the |player| couldn't be found, this is an invalid death
        
        const activity = this.activity_.get(player);
        if (!activity || activity.getActivityState() != GameActivity.kStateEngaged)
            return;  // the |player| isn't in a game, or the game hasn't started yet

        const killer = server.playerManager.getById(event.killerid);

        // Let the |activity| know about the fact that the player has died.
        activity.onPlayerDeath(player, killer, event.reason);
    }

    // Called when the given |player| has disconnected from the server. This means that they'll be
    // dropping out of whatever activity they were engaged in.
    onPlayerDisconnect(player) {
        const activity = this.activity_.get(player);
        if (!activity)
            return;  // the |player| was not engaged in any activity
        
        activity.removePlayer(player, /* disconnecting= */ true);
    }

    // ---------------------------------------------------------------------------------------------

    // Updates the |player|'s activity to |activity|. The state may only progress, so while moving
    // from a kStateRegistered state to a kStateEngaged state is fine, moving from a kStateEngaged
    // state to another kStateEngaged state is not, as that means something didn't get shut down.
    setPlayerActivity(player, activity) {
        if (!activity) {
            player.syncedData.minigameName = null;
            this.activity_.delete(player);
            return;
        }

        const currentActivity = this.activity_.get(player);
        if (currentActivity && currentActivity.getActivityState() === activity.getActivityState())
            throw new Error(`Cannot update a player's activity to the same activity state.`);
        
        player.syncedData.minigameName = activity.getActivityName();
        this.activity_.set(player, activity);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.playerManager.removeObserver(this);

        this.callbacks_.dispose();
        this.callbacks_ = null;
    }
}
