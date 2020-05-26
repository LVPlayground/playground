// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CollectableDatabase } from 'features/collectables/collectable_database.js';
import { MockCollectableDatabase } from 'features/collectables/test/mock_collectable_database.js';
import { RedBarrels } from 'features/collectables/red_barrels.js';
import { SprayTags } from 'features/collectables/spray_tags.js';

// Manages player state in regards to their collectables: tracking, statistics and maintaining. Will
// make sure that the appropriate information is available at the appropriate times.
export class CollectableManager {
    database_ = null;
    delegates_ = null;
    statistics_ = new WeakMap();

    constructor() {
        this.database_ = server.isTest() ? new MockCollectableDatabase()
                                         : new CollectableDatabase();

        this.delegates_ = new Map([
            [ CollectableDatabase.kRedBarrel, new RedBarrels(this) ],
            [ CollectableDatabase.kSprayTag, new SprayTags(this) ],
        ]);

        server.playerManager.addObserver(this, /* replayHistory= */ true);
    }

    // ---------------------------------------------------------------------------------------------

    // Returns the number of collectables collected by the player, filtered by the given |type| when
    // given, or aggregated across all types when omitted.
    getCollectableCountForPlayer(player, type = null) {
        if (!this.statistics_.has(player))
            return 0;

        const statistics = this.statistics_.get(player);
        if (type !== null) {
            if (!statistics.has(type))
                throw new Error(`Invalid collectable type given: ${type}.`);
            
            return statistics.get(type).collected.size;
        }

        let count = 0;

        for (const data of statistics.values())
            count += data.collected.size;

        return count;
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the |player| has identified to their account, and the associated information is
    // being loaded. Will begin loading collectable statistics for the player.
    onPlayerLogin(player) {
        return this.database_.loadCollectablesForPlayer(player).then(collectables => {
            if (!player.isConnected())
                return;  // the |player| has disconnected from the server since

            this.statistics_.set(player, collectables);

            // Ensure that Pawn has the latest metric on the number of collectables available for
            // the given |player|, as a number of benefits are still implemented there.
            player.syncedData.collectables = this.getCollectableCountForPlayer(player);
        });
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.playerManager.removeObserver(this);

        for (const delegate of this.delegates_.values())
            delegate.dispose();
        
        this.delegates_.clear();
        this.delegates_ = null;
    }
}
