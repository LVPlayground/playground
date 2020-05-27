// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CollectableDatabase } from 'features/collectables/collectable_database.js';
import { CollectableManager } from 'features/collectables/collectable_manager.js';
import Feature from 'components/feature_manager/feature.js';

import * as benefits from 'features/collectables/collectable_benefits.js';

// Implementation of the Red Barrels feature, which scatters a series of barrels throughout San
// Andreas that players can "collect" by blowing them up.
export default class Collectables extends Feature {
    manager_ = null;

    constructor() {
        super();

        // Certain behaviour of the Collectables feature is configurable as settings.
        const settings = this.defineDependency('settings');

        // The manager is responsible for keeping track which collectables have been collected by
        // which players, and enables creation of new "rounds" of collectables.
        this.manager_ = new CollectableManager(settings);

        if (!server.isTest())
            this.manager_.initialize();
    }

    // ---------------------------------------------------------------------------------------------

    // Returns whether the |player| is able to use the given |benefit|.
    isPlayerEligibleForBenefit(player, benefit) {
        switch (benefit) {
            // TODO: Revise this in the "Collectable" update, LVP 47.
            case benefits.kBenefitQuickVehicleAccess:
                const sprayTagsCollected =
                    this.manager_.getCollectableCountForPlayer(
                        player, CollectableDatabase.kSprayTag);
                
                return sprayTagsCollected >= 100;
        }

        return false;
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.manager_.dispose();
        this.manager_ = null;
    }
}
