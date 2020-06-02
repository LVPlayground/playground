// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CollectableCommands } from 'features/collectables/collectable_commands.js';
import { CollectableDatabase } from 'features/collectables/collectable_database.js';
import { CollectableManager } from 'features/collectables/collectable_manager.js';
import Feature from 'components/feature_manager/feature.js';

import * as achievements from 'features/collectables/achievements.js';
import * as benefits from 'features/collectables/collectable_benefits.js';

// Mapping of which benefits map to having to obtain which achievements.
const kBenefitMapping = new Map([
    [ benefits.kBenefitBasicSprayQuickVehicleAccess, achievements.kAchievementSprayTagBronze ],
    [ benefits.kBenefitBasicBarrelQuickVehicleAccess, achievements.kAchievementRedBarrelBronze ],
    [ benefits.kBenefitFullQuickVehicleAccess, achievements.kAchievementSprayTagPlatinum ],
    [ benefits.kBenefitBombShop, achievements.kAchievementSprayTagSilver ],
    [ benefits.kBenefitVehicleKeysColour, achievements.kAchievementRedBarrelSilver ],
    [ benefits.kBenefitVehicleKeysJump, achievements.kAchievementRedBarrelPlatinum ],
]);

// Implementation of the Red Barrels feature, which scatters a series of barrels throughout San
// Andreas that players can "collect" by blowing them up.
export default class Collectables extends Feature {
    commands_ = null;
    manager_ = null;

    constructor() {
        super();

        // Certain behaviour of the Collectables feature is configurable as settings.
        const settings = this.defineDependency('settings');

        // The manager is responsible for keeping track which collectables have been collected by
        // which players, and enables creation of new "rounds" of collectables.
        this.manager_ = new CollectableManager(this, settings);

        // The commands are the player's interfaces towards being able to control their collectables
        // and achievements, as well as seeing other player's statistics.
        this.commands_ = new CollectableCommands(this.manager_, settings);

        // Enable Pawn code to determine whether a particular player is eligible to receive a given
        // benefit. The Pawn code is responsible for issuing an error when they're not.
        provideNative(
            'IsPlayerEligibleForBenefit', 'ii',
            Collectables.prototype.isPlayerEligibleForBenefitPawn.bind(this));

        if (!server.isTest())
            this.manager_.initialize();
    }

    // ---------------------------------------------------------------------------------------------

    // Awards the given |achievement| to the |player|. It's safe to award an achievement multiple
    // times, but a user interface and effects will only happen the first time it happens.
    awardAchievement(player, achievement) {
        const achievements = this.manager_.getDelegate(CollectableDatabase.kAchievement);
        if (!achievements)
            return;  // achievements are disabled
        
        achievements.awardAchievement(player, achievement);
    }

    // Returns whether the |player| has the given |achievement|. Do not use this to change the
    // availability of benefits, instead, use `isPlayerEligibleForBenefit` to that purpose.
    hasAchievement(player, achievement, round = true) {
        const achievements = this.manager_.getDelegate(CollectableDatabase.kAchievement);
        return achievements && achievements.hasAchievement(player, achievement, round);
    }

    // Returns whether the |player| is able to use the given |benefit|. Each benefit is strongly
    // tied to a particular achievement that can be awarded to the |player|. This method is the
    // canonical place for such associations to live, used by both JavaScript and Pawn code.
    isPlayerEligibleForBenefit(player, benefit) {
        const requiredAchievements = kBenefitMapping.get(benefit) || [];
        const achievements = this.manager_.getDelegate(CollectableDatabase.kAchievement);

        // Allow the |benefit| if the requirements are not known, otherwise it's unachievable.
        if (!requiredAchievements.length || !achievements)
            return true;

        for (const achievement of requiredAchievements) {
            if (!achievements.hasAchievement(player, achievement, /* round= */ false))
                return false;
        }

        return true;
    }

    // ---------------------------------------------------------------------------------------------

    // Variant of the `isPlayerEligibleForBenefit()` method that's been made accessible to Pawn.
    isPlayerEligibleForBenefitPawn(playerid, benefit) {
        const player = server.playerManager.getById(playerid);
        if (!player)
            return 0;
        
        return this.isPlayerEligibleForBenefit(player, benefit) ? 1 : 0;
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        provideNative('IsPlayerEligibleForBenefit', 'ii', (playerid, benefit) => 0);

        this.commands_.dispose();
        this.commands_ = null;

        this.manager_.dispose();
        this.manager_ = null;
    }
}
