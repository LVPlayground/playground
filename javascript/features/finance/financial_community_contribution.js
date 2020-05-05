// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Initial delay before the community contribution collections will begin. This gives the full
// gamemode some time to set everything up, before blasting players with tax.. uh.. gifts.
export const kInitialCollectionDelayMs = 2 * 60 * 1000;  // two minutes

// Minimum and maximum collection cycle tmies
const kMinimumCycleIntervalSec = 5;
const kMaximumCycleIntervalSec = 1800;

// Implements people's involuntary community contributions.
export class FinancialCommunityContribution {
    regulator_ = null;
    settings_ = null;

    disposed_ = null;

    constructor(regulator, settings) {
        this.regulator_ = regulator;
        this.settings_ = settings;

        this.disposed_ = false;
    }

    // Spins until the community contribution system has been disposed of. The interval can be
    // configured by Management members through the `/lvp settings` command.
    async collect() {
        await wait(kInitialCollectionDelayMs);

        while (!this.disposed_) {
            for (const player of server.playerManager) {
                if (player.isNonPlayerCharacter())
                    continue;

                this.collectContributionForPlayer(player);
            }

            await wait(this.getCollectionDelaySec() * 1000);
        }
    }

    // Collects the community contribution from |player| and lets them know about their entirely
    // voluntary donation. This depends on the player's condition and status.
    collectContributionForPlayer(player) {
        let collectionBase = null;
        let collectionPercentage = null;

        const playerWealth = this.regulator_.getPlayerCashAmount(player);

        // Determine the minimum wealth level at which the |player| has to start paying tax, and
        // what percentage of tax they have to pay after beyond that.
        if (player.isVip()) {
            collectionBase = this.settings_.getValue('financial/community_contribution_vip_base');
            collectionPercentage =
                this.settings_.getValue('financial/community_contribution_vip_pct');
        } else if (player.isRegistered()) {
            collectionBase =
                this.settings_.getValue('financial/community_contribution_player_base');
            collectionPercentage =
                this.settings_.getValue('financial/community_contribution_player_pct');
        } else {
            collectionBase = this.settings_.getValue('financial/community_contribution_guest_base');
            collectionPercentage =
                this.settings_.getValue('financial/community_contribution_guest_pct');
        }

        // The |contributionBase| will be ignored, but every penny beyond that will be taxed at
        // the configured percentage. This must yield a positive contribution amount.
        const contribution =
            Math.floor((playerWealth - collectionBase) * (collectionPercentage / 100));

        if (contribution <= 0)
            return;

        

        // TODO: Send the |player| a message.

        this.regulator_.setPlayerCashAmount(player, playerWealth - contribution);
    }

    // Returns the configured collection delay in seconds. This method will clamp the delay to a
    // valid range of [5, 1800] seconds, to avoid crazy values.
    getCollectionDelaySec() {
        const configuredDelay =
            this.settings_.getValue('financial/community_contribution_cycle_sec');
        
        if (configuredDelay < kMinimumCycleIntervalSec)
            return kMinimumCycleIntervalSec;
        if (configuredDelay > kMaximumCycleIntervalSec)
            return kMaximumCycleIntervalSec;
        
        return configuredDelay;
    }

    dispose() {
        this.disposed_ = true;
    }
}
