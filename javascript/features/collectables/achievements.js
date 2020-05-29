// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CollectableBase } from 'features/collectables/collectable_base.js';

// -------------------------------------------------------------------------------------------------
// Next ID: 9
// -------------------------------------------------------------------------------------------------

// Spray Tag achievements: awarded when the player gathers { 10, 40, 90, 100 } spray tags.
export const kAchievementSprayTagBronze = 1;
export const kAchievementSprayTagSilver = 2;  // kBenefitBombShop
export const kAchievementSprayTagGold = 3;
export const kAchievementSprayTagPlatinum = 4;

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

    constructor(manager) {
        super();

        this.manager_ = manager;
    }

    // ---------------------------------------------------------------------------------------------

    // Returns whether the |player| has the given |achievement|. The |round| boolean, when set, will
    // restrict the check to the player's current round of collecting achievements.
    hasAchievement(player, achievement, round = true) {

    }

    // Awards the |player| the given |achievement|. Should no-op when they've already got it.
    awardAchievement(player, achievement) {

    }

    // ---------------------------------------------------------------------------------------------
    // CollectableBase implementation:
    // ---------------------------------------------------------------------------------------------

    // Clears all the collectables for the given |player|, generally because they've left the server
    // or, for some other reason, should not participate in the game anymore.
    clearCollectablesForPlayer(player) {}

    // Called when the collectables for the |player| have to be refreshed because (a) they've joined
    // the server as a guest, (b) they've identified to their account, or (c) they've started a new
    // round of collectables and want to collect everything again.
    refreshCollectablesForPlayer(player, collected) {}

    // ---------------------------------------------------------------------------------------------

    dispose() {}
}
