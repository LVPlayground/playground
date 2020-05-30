// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CollectableBase } from 'features/collectables/collectable_base.js';
import { CollectableDatabase } from 'features/collectables/collectable_database.js';

// -------------------------------------------------------------------------------------------------
// Next ID: 9
// -------------------------------------------------------------------------------------------------

// Spray Tag achievements: awarded when the player gathers { 10, 40, 90, 100 } spray tags.
export const kAchievementSprayTagBronze = 1;
export const kAchievementSprayTagSilver = 2;  // kBenefitBombShop
export const kAchievementSprayTagGold = 3;
export const kAchievementSprayTagPlatinum = 4;  // kBenefitQuickVehicleAccess

// Red Barrel achievements: awarded when the player gathers { 10, 40, 90, 100 } red barrels.
export const kAchievementRedBarrelBronze = 5;
export const kAchievementRedBarrelSilver = 6;
export const kAchievementRedBarrelGold = 7;
export const kAchievementRedBarrelPlatinum = 8;

// -------------------------------------------------------------------------------------------------

// Textual descriptions of the achievements that can be awarded by the game.
export const kAchievements = new Map([
    [ kAchievementSprayTagBronze,
      { name: 'Tag', text: 'Tagged 10 Spray Tags' } ],
    [ kAchievementSprayTagSilver,
      { name: 'Back to Back', text: 'Tagged 40 Spray Tags' } ],
    [ kAchievementSprayTagGold,
      { name: 'Heaven Spot', text: 'Tagged 90 Spray Tags' } ],
    [ kAchievementSprayTagPlatinum,
      { name: 'Graffiti Angel', text: 'Tagged all the Spray Tags' } ],
    [ kAchievementRedBarrelBronze,
      { name: 'Firebug', text: 'Exploded 10 Red Barrels' } ],
    [ kAchievementRedBarrelSilver,
      { name: 'Arsonist', text: 'Exploded 40 Red Barrels' } ],
    [ kAchievementRedBarrelGold,
      { name: 'Incendiarist', text: 'Exploded 90 Red Barrels' } ],
    [ kAchievementRedBarrelPlatinum,
      { name: `Jomeri's Syndrome`, text: 'Exploded all the Red Barrels' } ],
]);

// -------------------------------------------------------------------------------------------------

// Implements tracking and collecting of achievements for each of the players. They cannot be drawn
// on the map, but fit in with other collectables reasonably well otherwise.
export class Achievements extends CollectableBase {
    manager_ = null;
    players_ = new WeakMap();

    constructor(collectables, manager) {
        super();

        this.collectables_ = collectables;
        this.manager_ = manager;
    }

    // ---------------------------------------------------------------------------------------------

    // Returns whether the |player| has the given |achievement|. The |round| boolean, when set, will
    // restrict the check to the player's current round of collecting achievements.
    hasAchievement(player, achievement, round = true) {
        if (!this.players_.has(statistics))
            return false;  // the data for |player| has not been loaded yet
        
        const statistics = this.players_.get(statistics);

        if (round)
            return statistics.collectedRound.has(achievement);
        else
            return statistics.collected.has(achievement);
    }

    // Awards the |player| the given |achievement|. Should no-op when they've already got it.
    awardAchievement(player, achievement) {
        if (!this.players_.has(player))
            return;  // the data for |player| has not been loaded yet
          
        const statistics = this.players_.get(player);
        if (statistics.collectedRound.has(achievement))
            return;  // the |player| already obtained the given |achievement|

        if (!statistics.collected.has(achievement))
            this.activateAchievementEffects(player, achievement);

        statistics.collected.add(achievement);
        statistics.collectedRound.add(achievement);

        // Make sure that the achieved achievement will be stored between sessions.
        this.manager_.markCollectableAsCollected(
            player, CollectableDatabase.kAchievement, statistics.round, achievement);
        
        // Show a notification to the |player| about having achieved this milestone.
        const { name, text, level } = kAchievements.get(achievement);

        this.manager_.showNotification(player, name, text);
    }

    // Called when the |player| has been awarded the given |achievement|, activating its effects.
    // This is only necessary for some of the achievements.
    activateAchievementEffects(player, achievement) {
        switch (achievement) {
            case kAchievementRedBarrelSilver:
                player.syncedData.vehicleKeys |= Vehicle.kVehicleKeysColourChange;
                break;
              
            case kAchievementRedBarrelPlatinum:
                player.syncedData.vehicleKeys |= Vehicle.kVehicleKeysJump;
                break;
        }
    }

    // ---------------------------------------------------------------------------------------------
    // CollectableBase implementation:
    // ---------------------------------------------------------------------------------------------

    // Clears all the collectables for the given |player|, generally because they've left the server
    // or, for some other reason, should not participate in the game anymore.
    clearCollectablesForPlayer(player) {
        this.players_.delete(player);
    }

    // Called when the collectables for the |player| have to be refreshed because (a) they've joined
    // the server as a guest, (b) they've identified to their account, or (c) they've started a new
    // round of collectables and want to collect everything again.
    refreshCollectablesForPlayer(player, statistics) {
        const existingAchievements = new Set();
        if (this.players_.has(player)) {
            const achievements = this.players_.get(player);
            for (const achievement of achievements.collected)
                existingAchievements.add(achievement);
        }

        this.players_.set(player, statistics);

        for (const achievement of statistics.collected) {
            if (!existingAchievements.has(achievement))
                this.activateAchievementEffects(player, achievement);
        }
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {}
}
