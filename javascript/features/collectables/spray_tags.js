// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CollectableBase } from 'features/collectables/collectable_base.js';
import { CollectableDatabase } from 'features/collectables/collectable_database.js';

import * as achievements from 'features/collectables/achievements.js';

// Title of the notification that will be shown to the player upon tagging a spray tag.
const kNotificationTitle = 'tagged!';

// File (JSON) in which all the spray tags have been stored. Each has a position and a rotation.
const kSprayTagsDataFile = 'data/collectables/spray_tags.json';

// Distances, in in-game units, between the player and the position they're spraying, and the
// maximum distance between that position and the spray tag itself.
const kSprayTargetDistance = 2;
const kSprayTargetMaximumDistance = 3;

// Model Ids for the spray tags, depending on whether they're tagged or untagged.
export const kSprayTagTaggedModelId = 18659;
export const kSprayTagUntaggedModelId = 18664;

// Implements the SprayTag functionality, where players have to find the spray tags (usually on the
// walls) and spray them in order to collect them. Detection of the spray action is done in Pawn.
export class SprayTags extends CollectableBase {
    collectables_ = null;
    manager_ = null;

    // Maps with per-player information on progress statistics and the created tag objects.
    playerStatistics_ = new Map();
    playerTags_ = new Map();

    constructor(collectables, manager) {
        super({
            mapIconType: 63 /* Pay 'n' Spray */,
            name: 'Spray Tags',
            singularName: 'Spray Tag'
        });

        this.collectables_ = collectables;
        this.manager_ = manager;

        // native ProcessSprayTagForPlayer(playerid);
        provideNative(
            'ProcessSprayTagForPlayer', 'i',
            SprayTags.prototype.processSprayTagForPlayer.bind(this));
    }

    // ---------------------------------------------------------------------------------------------
    // CollectableBase implementation:
    // ---------------------------------------------------------------------------------------------

    // Called when the collectables have to be initialized. The data file lists them all, with two
    // vectors per spray tag, one for position, one for rotation.
    initialize() {
        const data = JSON.parse(readFile(kSprayTagsDataFile));

        for (const sprayTag of data) {
            this.addCollectable(sprayTag.id, {
                position: new Vector(...sprayTag.position),
                rotation: new Vector(...sprayTag.rotation),
            });
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
        if (!this.playerTags_.has(player))
            return;  // the |player| hasn't had their state initialized
        
        const tags = this.playerTags_.get(player);
        for (const tag of tags.keys())
            tag.dispose();
        
        this.playerTags_.delete(player);
        this.playerStatistics_.delete(player);

        // Prune the scoped entities to get rid of references to deleted objects.
        this.entities.prune();
    }

    // Called when the collectables for the |player| have to be refreshed because (a) they've joined
    // the server as a guest, (b) they've identified to their account, or (c) they've started a new
    // round of collectables and want to collect everything again.
    refreshCollectablesForPlayer(player, statistics) {
        if (this.playerTags_.has(player))
            this.clearCollectablesForPlayer(player);
        
        this.playerStatistics_.set(player, statistics);

        const tags = new Map();
        for (const [ sprayTagId, { position, rotation } ] of this.getCollectables()) {
            const collected = statistics.collectedRound.has(sprayTagId);
            const modelId = collected ? kSprayTagTaggedModelId
                                      : kSprayTagUntaggedModelId;

            const tag = this.entities.createObject({
                modelId, position, rotation,

                interiorId: 0,  // main world
                virtualWorld: 0,  // main world
                playerId: player.id,
            });

            tags.set(tag, sprayTagId);
        }

        this.playerTags_.set(player, tags);
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

    // Called when a spray tag has to be processed for the given |playerid|. When they're close
    // enough to an uncollected tag, and are facing it, it will be marked as collection.
    processSprayTagForPlayer(playerid) {
        const player = server.playerManager.getById(playerid);
        if (!player)
            return;  // the |player| is not connected to the server, an invalid event

        if (!this.playerTags_.has(player) || !this.playerStatistics_.has(player))
            return;  // the |player| hasn't had their state initialized
        
        const kTotalSprayTags = this.getCollectableCount();

        const playerPosition = player.position;
        const playerRotation = player.rotation;
        
        const statistics = this.playerStatistics_.get(player);

        const target = playerPosition.translateTo2D(kSprayTargetDistance, playerRotation);
        const tags = this.playerTags_.get(player);

        for (const [ tag, sprayTagId ] of tags) {
            if (tag.modelId === kSprayTagTaggedModelId)
                continue;  // this |tag| has already been collected
            
            const { position, rotation } = this.getCollectable(sprayTagId);
            if (position.distanceTo(target) > kSprayTargetMaximumDistance)
                continue;  // this |tag| is too far away
            
            let remaining = kTotalSprayTags - this.countCollectablesForPlayer(player).round - 1;
            let message = null;

            // Compose an appropriate message to show to the player now that they've tagged a
            // particular Spray Tag. This depends on how many tags they've got remaining.
            switch (remaining) {
                case 0:
                    message = `all Spray Tags have been tagged!`;
                    break;
                case 1:
                    message = 'only one more tag to go...';
                    break;
                default:
                    message = `${kTotalSprayTags - remaining} / ${kTotalSprayTags}`;
                    break;
            }

            // Show a notification to the player about the Spray Tags they've collected.
            this.manager_.showNotification(player, kNotificationTitle, message);
    
            // Mark the collectable as having been collected, updating the |player|'s stats.
            statistics.collected.add(sprayTagId);
            statistics.collectedRound.add(sprayTagId);

            this.awardAchievementWhenApplicable(player);
            this.manager_.markCollectableAsCollected(
                player, CollectableDatabase.kSprayTag, statistics.round, sprayTagId);

            // Delete the |tag|, since the player will no longer be needing it. Instead, we create
            // a new tag in the same position with the |kSprayTagTaggedModelId|.
            tag.dispose();

            const completedTag = this.entities.createObject({
                modelId: kSprayTagTaggedModelId,
                position, rotation,

                interiorId: 0,  // main world
                virtualWorld: 0,  // main world
                playerId: player.id,
            });

            tags.set(completedTag, sprayTagId);
            tags.delete(tag);
            break;
        }
    }

    // Awards an achievement to the |player| when their collectable stats in the current round are
    // applicable to be awarded one. The thresholds are defined in achievements.js as well.
    awardAchievementWhenApplicable(player) {
        const kMilestones = new Map([
            [  10, achievements.kAchievementSprayTagBronze ],
            [  40, achievements.kAchievementSprayTagSilver ],
            [  90, achievements.kAchievementSprayTagGold ],
            [ 100, achievements.kAchievementSprayTagPlatinum ],
        ]);

        const achievement = kMilestones.get(this.countCollectablesForPlayer(player).round);
        if (achievement)
            this.collectables_.awardAchievement(player, achievement);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        super.dispose();

        provideNative('ProcessSprayTagForPlayer', 'i', (playerid) => 0);
    }
}
