// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CollectableBase } from 'features/collectables/collectable_base.js';
import { CollectableDatabase } from 'features/collectables/collectable_database.js';

// -------------------------------------------------------------------------------------------------
// Next ID: 9
// -------------------------------------------------------------------------------------------------

// Spray Tag achievements: awarded when the player gathers { 10, 40, 90, 100 } spray tags.
export const kAchievementSprayTagBronze = 1;  // kBenefitBasicSprayQuickVehicleAccess
export const kAchievementSprayTagSilver = 2;
export const kAchievementSprayTagGold = 3;  // kBenefitBombShop
export const kAchievementSprayTagPlatinum = 4;  // kBenefitFullQuickVehicleAccess

// Red Barrel achievements: awarded when the player gathers { 10, 40, 90, 100 } red barrels.
export const kAchievementRedBarrelBronze = 5;  // kBenefitBasicBarrelQuickVehicleAccess
export const kAchievementRedBarrelSilver = 6;  // kBenefitVehicleKeysColour
export const kAchievementRedBarrelGold = 7;
export const kAchievementRedBarrelPlatinum = 8;  // kBenefitVehicleKeysJump

// Reaction Tests quantity achievements: awarded when hitting a certain number of reaction tests.
export const kAchievementReactionTestBronze = 9;
export const kAchievementReactionTestSilver = 10;
export const kAchievementReactionTestGold = 11;

// Reaction Test performance achievement: awarded when winning ten reaction tests in a row.
export const kAchievementReactionTestSequence = 12;

// Reaction Test performance achievement: awarded when answering a reaction test super quickly.
export const kAchievementReactionTestSpeed = 13;

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
    [ kAchievementReactionTestBronze,
      { name: 'Nimble Critter', text: 'Won 10 reaction tests' } ],
    [ kAchievementReactionTestSilver,
      { name: 'Quick Addict', text: 'Won 100 reaction tests' } ],
    [ kAchievementReactionTestGold,
      { name: 'Electrolyte', text: 'Won 1000 reaction tests' } ],
    [ kAchievementReactionTestSequence,
      { name: 'The Streak', text: 'Won 10 reaction tests in a row' } ],
    [ kAchievementReactionTestSpeed,
      { name: 'keybind.cs', text: 'Won a reaction test in under two seconds' } ],
]);

// -------------------------------------------------------------------------------------------------

// Implements tracking and collecting of achievements for each of the players. They cannot be drawn
// on the map, but fit in with other collectables reasonably well otherwise.
export class Achievements extends CollectableBase {
    manager_ = null;

    constructor(collectables, manager) {
        super({ name: 'Achievements' });

        this.collectables_ = collectables;
        this.manager_ = manager;
    }

    // ---------------------------------------------------------------------------------------------

    // Returns whether the |player| has the given |achievement|. The |round| boolean, when set, will
    // restrict the check to the player's current round of collecting achievements.
    hasAchievement(player, achievement, round = true) {
        if (!this.hasPlayerStatistics(player))
            return false;  // the data for |player| has not been loaded yet
        
        const statistics = this.getPlayerStatistics(player);

        if (round)
            return statistics.collectedRound.has(achievement);
        else
            return statistics.collected.has(achievement);
    }

    // Awards the |player| the given |achievement|. Should no-op when they've already got it.
    awardAchievement(player, achievement) {
        if (!this.hasPlayerStatistics(player))
            return;  // the data for |player| has not been loaded yet
          
        const statistics = this.getPlayerStatistics(player);
        if (statistics.collectedRound.has(achievement))
            return;  // the |player| already obtained the given |achievement|

        this.announceAchievement(player, achievement);

        if (!statistics.collected.has(achievement))
            this.activateAchievementEffects(player, achievement, /* unlocked= */ true);

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
    activateAchievementEffects(player, achievement, unlocked = false) {
        if (unlocked) {
            const kUnlockMessages = new Map([
                [
                    kAchievementSprayTagBronze,
                    Message.format(Message.ACHIEVEMENT_VEHICLE_SPAWN, '/pre', '/sul')
                ],
                [
                    kAchievementSprayTagGold,
                    Message.ACHIEVEMENT_BOMB_SHOP
                ],
                [
                    kAchievementSprayTagPlatinum,
                    Message.format(Message.ACHIEVEMENT_VEHICLE_SPAWN, '/nrg', '/inf')
                ],
                [
                    kAchievementRedBarrelBronze,
                    Message.format(Message.ACHIEVEMENT_VEHICLE_SPAWN, '/ele', '/tur')
                ],
                [
                    kAchievementRedBarrelSilver,
                    Message.ACHIEVEMENT_VEHICLE_COLOR
                ],
                [
                    kAchievementRedBarrelPlatinum,
                    Message.ACHIEVEMENT_VEHICLE_JUMP
                ],
            ]);

            const message = kUnlockMessages.get(achievement);
            if (message)
                player.sendMessage(message);
        }

        switch (achievement) {
            case kAchievementRedBarrelSilver:
                player.syncedData.vehicleKeys |= Vehicle.kVehicleKeysColourChange;
                break;
              
            case kAchievementRedBarrelPlatinum:
                player.syncedData.vehicleKeys |= Vehicle.kVehicleKeysJump;
                break;
        }
    }

    // Announces the given |achievement|, obtained by |player|, to other people on the server. This
    // is a big deal, as most achievements are not easy to obtain.
    announceAchievement(player, achievement) {
        const { name } = kAchievements.get(achievement);
        const formattedMessage = Message.format(Message.ACHIEVEMENT, player.name, name);

        for (const recipient of server.playerManager) {
            if (recipient.isNonPlayerCharacter())
                continue;
            
            recipient.sendMessage(formattedMessage);
        }
    }

    // ---------------------------------------------------------------------------------------------
    // CollectableBase implementation:
    // ---------------------------------------------------------------------------------------------

    // Gets the number of achievements that exist on the server.
    getCollectableCount() { return kAchievements.size; }

    // Starts a new round of collectables for the given |player|. This is not supported for
    // achievements, since it's not clear where they player should start again.
    startCollectableRoundForPlayer(player) {
        throw new Error(`Achievements do not support multiple rounds.`);
    }

    // Called when the collectables for the |player| have to be refreshed because (a) they've joined
    // the server as a guest, (b) they've identified to their account, or (c) they've started a new
    // round of collectables and want to collect everything again.
    refreshCollectablesForPlayer(player, statistics) {
        const existingAchievements = new Set();
        if (this.hasPlayerStatistics(player)) {
            const achievements = this.getPlayerStatistics(player);
            for (const achievement of achievements.collected)
                existingAchievements.add(achievement);
        }

        this.setPlayerStatistics(player, statistics);

        for (const achievement of statistics.collected) {
            if (!existingAchievements.has(achievement))
                this.activateAchievementEffects(player, achievement);
        }
    }
}
