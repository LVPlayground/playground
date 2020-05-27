// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CollectableDelegate } from 'features/collectables/collectable_delegate.js';
import ScopedEntities from 'entities/scoped_entities.js';

// File (JSON) in which all the spray tags have been stored. Each has a position and a rotation.
const kSprayTagsDataFile = 'data/collectables/spray_tags.json';

// Distances, in in-game units, between the player and the position they're spraying, and the
// maximum distance between that position and the spray tag itself.
const kSprayTargetDistance = 2;
const kSprayTargetMaximumDistance = 3;

// Model Ids for the spray tags, depending on whether they're tagged or untagged.
const kSprayTagTaggedModelId = 18659;
const kSprayTagUntaggedModelId = 18664;

// Implements the SprayTag functionality, where players have to find the spray tags (usually on the
// walls) and spray them in order to collect them. Detection of the spray action is done in Pawn.
export class SprayTags extends CollectableDelegate {
    manager_ = null;

    entities_ = null;
    icons_ = null;
    tags_ = null;

    // Map from |player| to set of GameObject instances for all their personal tags.
    playerTags_ = null;

    constructor(manager) {
        super();

        this.manager_ = manager;

        this.entities_ = new ScopedEntities();
        this.icons_ = new Set();        
        this.tags_ = new Map();

        this.playerTags_ = new Map();

        // native ProcessSprayTagForPlayer(playerid);
        provideNative(
            'ProcessSprayTagForPlayer', 'i',
            SprayTags.prototype.processSprayTagForPlayer.bind(this));
    }

    // ---------------------------------------------------------------------------------------------
    // CollectableDelegate implementation:
    // ---------------------------------------------------------------------------------------------

    // Called when the collectables have to be initialized. The data file lists them all, with two
    // vectors per spray tag, one for position, one for rotation.
    initialize() {
        const data = JSON.parse(readFile(kSprayTagsDataFile));

        for (const sprayTag of data) {
            if (this.tags_.has(sprayTag.id))
                throw new Error(`Duplicate spray tag found for Id:${sprayTag.id}`);

            this.tags_.set(sprayTag.id, {
                position: new Vector(...sprayTag.position),
                rotation: new Vector(...sprayTag.rotation),
            });
        }
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

        // Prune the scoped entities to get rid of references to deleted objects.
        this.entities_.prune();
    }

    // Called when the collectables for the |player| have to be refreshed because (a) they've joined
    // the server as a guest, (b) they've identified to their account, or (c) they've started a new
    // round of collectables and want to collect everything again.
    refreshCollectablesForPlayer(player, collected) {
        if (this.playerTags_.has(player))
            this.clearCollectablesForPlayer(player);
        
        const tags = new Map();
        for (const [ sprayTagId, { position, rotation } ] of this.tags_) {
            const modelId = collected.has(sprayTagId) ? kSprayTagTaggedModelId
                                                      : kSprayTagUntaggedModelId;

            const tag = this.entities_.createObject({
                modelId, position, rotation,

                interiorId: 0,  // main world
                virtualWorld: 0,  // main world
                playerId: player.id,
            });

            tags.set(tag, sprayTagId);
        }

        this.playerTags_.set(player, tags);
    }

    // Called when the map icons for the collectable should either be shown (when |visible| is set)
    // or hidden. This is a configuration setting available to Management members.
    refreshCollectableMapIcons(visible, streamDistance) {
        if ((visible && this.icons_.size) || (!visible && !this.icons_.size))
            return;  // no change in visibility state

        // Remove all created icons if |visible| has been set to false.
        if (!visible) {
            for (const mapIcon of this.icons_)
                mapIcon.dispose();
            
            this.icons_.clear();
            return;
        }

        // Otherwise create an icon for each of the defined spray tags.
        for (const { position } of this.tags_.values()) {
            this.icons_.add(this.entities_.createMapIcon({
                type: 63,  // Pay 'n' Spray
                position, streamDistance,
            }));
        }
    }

    // ---------------------------------------------------------------------------------------------

    // Called when a spray tag has to be processed for the given |playerid|. When they're close
    // enough to an uncollected tag, and are facing it, it will be marked as collection.
    processSprayTagForPlayer(playerid) {
        const player = server.playerManager.getById(playerid);
        if (!player)
            return;  // the |player| is not connected to the server, an invalid event
        
        if (!this.playerTags_.has(player))
            return;  // the |player| hasn't had their state initialized
        
        const playerPosition = player.position;
        const playerRotation = player.rotation;

        const target = playerPosition.translateTo2D(kSprayTargetDistance, playerRotation);
        const tags = this.playerTags_.get(player);

        for (const [ tag, sprayTagId ] of tags) {
            if (tag.modelId === kSprayTagTaggedModelId)
                continue;  // this |tag| has already been collected
            
            const { position } = this.tags_.get(sprayTagId);
            if (position.distanceTo(target) > kSprayTargetMaximumDistance)
                continue;  // this |tag| is too far away
            
            console.log(`Tag: [${position.x}, ${position.y}], Player: [${playerPosition.x}, ${playerPosition.y}]`)
            console.log(`Angle: [${position.angleTo(playerPosition)} or ${playerPosition.angleTo(position)}]`)
            console.log(`Rotation: [${playerRotation}]`);
            
            break;
        }
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        provideNative('ProcessSprayTagForPlayer', 'i', (playerid) => 0);

        this.entities_.dispose();
        this.entities_ = null;
    }
}
