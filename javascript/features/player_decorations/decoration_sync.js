// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// This class is responsible for making sure that the objects that should be visible for a player
// will in fact remain visible for that player, unless they get suspended.
export class DecorationSync {
    // How many decorations are we able to attach to a player?
    static kDecorationSlotCount = 10;

    #registry_ = null;
    #suspended_ = null;

    constructor(registry) {
        this.#registry_ = registry;
        this.#suspended_ = new WeakSet();

        // Observe the player manager to be told about the login event, which is when we'll apply
        // the player's aesthetical decisions to their character.
        server.playerManager.addObserver(this, /* replayHistory= */ true);
    }

    // ---------------------------------------------------------------------------------------------

    // Resumes display of decorations for the given |player|. This will make all the configured
    // decorations appear on their person.
    applyDecorationsForPlayer(player) {
        let filteredDecorations = [];
        let iterated = false;
        let slot = 0;

        // Iterate over each of the decorations defined in the player's profile, validate them and
        // attach them to the |player|, up to a maximum of |kDecorationSlotCount| decorations.
        for (const decorationUniqueId of player.account.skinDecorations) {
            iterated = true;

            const decoration = this.#registry_.getDecoration(decorationUniqueId);
            if (!decoration)
                continue;  // the |decorationUniqueId| does not exist anymore, drop it

            // Assign the |decoration| to the next available |slot|. The Decoration instance will
            // have validated all information already, so no need to do that again.
            player.attachObject(
                slot++, decoration.modelId, decoration.bone, decoration.offset, decoration.rotation,
                decoration.scale, decoration.primaryColor, decoration.secondaryColor);

            filteredDecorations.push(decorationUniqueId);

            // If the |slot| is now equal or above the number of available slots, break the loop.
            if (slot >= DecorationSync.kDecorationSlotCount)
                break;
        }

        // If we |iterated| at all, make sure to update the stored account data with the new list of
        // filtered decorations. This is significant as decorations might change over time.
        if (iterated)
            player.account.skinDecorations = filteredDecorations;
    }

    // Resumes display of decorations for the given |player|. This removes any of the suspensions
    // that they may be subject to, causing the decorations to re-appear next time they spawn. The
    // |applyImmediately| flag may be used to configure whether to re-set the decorations right now.
    resumeForPlayer(player, applyImmediately = true) {
        this.#suspended_.delete(player);

        if (applyImmediately)
            this.applyDecorationsForPlayer(player);
    }

    // Suspends display of decorations for the given |player|. This will remove all the configured
    // decorations from their person, and stop them from re-appearing when they spawn again.
    suspendForPlayer(player) {
        this.#suspended_.add(player);

        for (let slot = 0; slot < player.account.skinDecorations.length; ++slot)
            player.removeAttachedObject(slot);
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the |player| has spawned in the world. Unless their looks have been suspended,
    // will immediately apply all the decorations they'll be subject to.
    onPlayerSpawn(player) {
        if (!player.account.isIdentified())
            return;  // the |player| is not logged in to their account

        if (this.#suspended_.has(player))
            return;  // the |player| has had their decorations suspended

        if (!player.account.skinDecorations.length)
            return;  // the |player| has not configured any decorations

        this.applyDecorationsForPlayer(player);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.playerManager.removeObserver(this);

        this.#suspended_ = null;
        this.#registry_ = null;
    }
}
