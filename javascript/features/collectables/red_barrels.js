// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CollectableBase } from 'features/collectables/collectable_base.js';
import { CollectableDatabase } from 'features/collectables/collectable_database.js';
import { Vector } from 'base/vector.js';

import * as achievements from 'features/collectables/achievements.js';

// File (JSON) in which all the individual barrels have been stored. The JSON data will have been
// categorized per area, which are static properties on the RedBarrels class.
const kBarrelDataFile = 'data/collectables/red_barrels.json';

// Object Id that's been assigned to barrels throughout the map.
const kBarrelObjectId = 1225;

// Title of the notification that will be shown to the player upon blowing up a Red Barrel.
const kNotificationTitle = 'exploded!';

// Implements the Red Barrels functionality, where players have to shoot the red barrels scattered
// across the map in an effort to clean up all those dangerous explosives.
export class RedBarrels extends CollectableBase {
    // Identifiers for the different categories of barrels.
    static kAreaLasVenturas = 'Las Venturas';

    collectables_ = null;
    manager_ = null;

    // Maps with per-player information on the created barrel objects, and progress statistics.
    playerBarrels_ = new Map();
    playerStatistics_ = new Map();

    constructor(collectables, manager) {
        super({ mapIconType: 20 /* Fire */, name: 'Red Barrels', singularName: 'Red Barrel' });

        this.collectables_ = collectables;
        this.manager_ = manager;

        server.objectManager.addObserver(this);
    }

    // ---------------------------------------------------------------------------------------------
    // CollectableBase implementation:
    // ---------------------------------------------------------------------------------------------

    // Called when the collectables have to be initialized. All the Red Barrel data will be loaded
    // from the JSON configuration file to the |barrels_| class property.
    initialize() {
        const data = JSON.parse(readFile(kBarrelDataFile));

        for (const area of [ RedBarrels.kAreaLasVenturas ]) {
            if (!data.hasOwnProperty(area) || !Array.isArray(data[area]))
                throw new Error(`No barrels are defined for the ${area} area.`);

            for (const barrel of data[area]) {
                this.addCollectable(barrel.id, {
                    area,
                    position: new Vector(...barrel.position),
                    rotation: new Vector(...barrel.rotation),
                });
            }
        }
    }

    // Counts the number of collectables that the player has collected already. Returns a structure
    // in the format of { total, round }, both of which are numbers.
    countCollectablesForPlayer(player) {
        const statistics = this.playerStatistics_.get(player);

        return {
            total: statistics?.collected.size ?? 0,
            round: statistics?.collectedRound.size ?? 0,
        };
    }

    // Clears all the collectables for the given |player|, generally because they've left the server
    // or, for some other reason, should not participate in the game anymore.
    clearCollectablesForPlayer(player) {
        if (!this.playerBarrels_.has(player))
            return;  // the |player| already collected all the red barrels
        
        const barrels = this.playerBarrels_.get(player);
        for (const barrel of barrels.keys())
            barrel.dispose();
        
        this.playerBarrels_.delete(player);
        this.playerStatistics_.delete(player);

        // Prune the scoped entities to get rid of references to deleted objects.
        this.entities.prune();
    }

    // Called when the collectables for the |player| have to be refreshed because (a) they've joined
    // the server as a guest, (b) they've identified to their account, or (c) they've started a new
    // round of collectables and want to collect everything again.
    refreshCollectablesForPlayer(player, statistics) {
        if (this.playerBarrels_.has(player))
            this.clearCollectablesForPlayer(player);
        
        this.playerStatistics_.set(player, statistics);

        const barrels = new Map();
        for (const [ barrelId, { area, position, rotation } ] of this.getCollectables()) {
            if (statistics.collectedRound.has(barrelId))
                continue;  // the |player| has already collected this barrel

            // TODO: Consider the |area| when barrels are all over the map.

            const barrel = this.entities.createObject({
                modelId: kBarrelObjectId,
                position, rotation,

                interiorId: 0,  // main world
                virtualWorld: 0,  // main world
                playerId: player.id,
            });

            barrels.set(barrel, barrelId);
        }

        this.playerBarrels_.set(player, barrels);
    }

    // Called when the |player| wants to start a new round for these collectables. Their state
    // should thus be reset to that of a new player, without losing benefits.
    startCollectableRoundForPlayer(player) {
        const statistics = this.playerStatistics_.get(player);
        if (!statistics)
            throw new Error(`There are no statistics known for ${player.name}.`);
        
        statistics.collectedRound = new Set();
        statistics.round++;

        this.refreshCollectablesForPlayer(player, statistics);
    }
    
    // ---------------------------------------------------------------------------------------------

    // Called when the |player| has shot the given |object|. If this is one of their barrels, we'll
    // consider them as having scored a point.
    onPlayerShootObject(player, object) {
        if (!this.playerBarrels_.has(player) || !this.playerStatistics_.has(player))
            return;  // the |player| does not have any barrels
        
        const barrels = this.playerBarrels_.get(player);
        const statistics = this.playerStatistics_.get(player);

        if (!barrels.has(object))
            return;  // it's not one of our barrels that the player shot
        
        const kTotalBarrels = this.getCollectableCount();

        const barrelId = barrels.get(object);
        const remaining = barrels.size - 1;

        let message = null;

        // Compose an appropriate message to show to the player now that they've cleared a given
        // number of barrels. This depends on how many barrels are remaining.
        switch (remaining) {
            case 0:
                message = 'all Red Barrels have been cleaned up!';
                break;
            case 1:
                message = 'only one more barrel left to find';
                break;
            default:
                message = `${kTotalBarrels - remaining} / ${kTotalBarrels}`;
                break;
        }

        // Show a notification to the player about the Spray Tags they've collected.
        this.manager_.showNotification(player, kNotificationTitle, message);
    
        // Mark the collectable as having been collected, updating the |player|'s stats.
        statistics.collected.add(barrelId);
        statistics.collectedRound.add(barrelId);

        this.awardAchievementWhenApplicable(player);
        this.manager_.markCollectableAsCollected(
            player, CollectableDatabase.kRedBarrel, statistics.round, barrelId);

        // Dispose of the barrel's object, and delete it from any and all object tracking that's
        // remaining in this class. It won't be needed anymore.
        object.dispose();

        barrels.delete(object);

        if (!barrels.size)
            this.playerBarrels_.delete(player);
    }

        // Awards an achievement to the |player| when their collectable stats in the current round are
    // applicable to be awarded one. The thresholds are defined in achievements.js as well.
    awardAchievementWhenApplicable(player) {
        const kMilestones = new Map([
            [  10, achievements.kAchievementRedBarrelBronze ],
            [  40, achievements.kAchievementRedBarrelSilver ],
            [  90, achievements.kAchievementRedBarrelGold ],
            [ 100, achievements.kAchievementRedBarrelPlatinum ],
        ]);

        const achievement = kMilestones.get(this.countCollectablesForPlayer(player).round);
        if (achievement)
            this.collectables_.awardAchievement(player, achievement);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        super.dispose();

        server.objectManager.removeObserver(this);
    }
}
