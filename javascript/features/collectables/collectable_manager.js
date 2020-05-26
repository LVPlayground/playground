// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CollectableDatabase } from 'features/collectables/collectable_database.js';
import { MockCollectableDatabase } from 'features/collectables/test/mock_collectable_database.js';
import { RedBarrels } from 'features/collectables/red_barrels.js';
import ScopedCallbacks from 'base/scoped_callbacks.js';
import { SprayTags } from 'features/collectables/spray_tags.js';

// Identifier of the setting that controls collectable map icon visibility.
const kVisibilitySetting = 'playground/collectable_map_icons_display';

// Manages player state in regards to their collectables: tracking, statistics and maintaining. Will
// make sure that the appropriate information is available at the appropriate times.
export class CollectableManager {
    callbacks_ = null;
    database_ = null;
    delegates_ = null;
    settings_ = null;
    statistics_ = new WeakMap();

    constructor(settings) {
        this.database_ = server.isTest() ? new MockCollectableDatabase()
                                         : new CollectableDatabase();

        this.delegates_ = new Map([
            [ CollectableDatabase.kRedBarrel, new RedBarrels(this) ],
            [ CollectableDatabase.kSprayTag, new SprayTags(this) ],
        ]);

        this.callbacks_ = new ScopedCallbacks();
        this.callbacks_.addEventListener(
            'playerguestsession', CollectableManager.prototype.onPlayerGuestSession.bind(this));

        this.settings_ = settings;
        this.settings_.addReloadObserver(
            this, CollectableManager.prototype.initializeSettingObserver.bind(this));
        
        this.onMapIconVisibilityChange(null, settings().getValue(kVisibilitySetting));
        this.initializeSettingObserver();
        
        server.playerManager.addObserver(this, /* replayHistory= */ true);
    }

    initializeSettingObserver() {
        this.settings_().addSettingObserver(
            kVisibilitySetting,
            this, CollectableManager.prototype.onMapIconVisibilityChange.bind(this));
    }

    initialize() {
        for (const delegate of this.delegates_.values())
            delegate.initialize();
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

            // Create all the collectables on the map for the given |player|.
            for (const [ type, delegate ] of this.delegates_)
                delegate.refreshCollectablesForPlayer(player, collectables.get(type).collected);
        });
    }

    // Called when the player in |event| has started a session as a guest, which means that none of
    // their information will persist beyond this playing session.
    onPlayerGuestSession(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player)
            return;  // the |event| was sent for an invalid player

        // Create all the collectables on the map for the given |player|.
        for (const delegate of this.delegates_.values())
            delegate.refreshCollectablesForPlayer(player, new Set());
    }

    // Called when visibility of collectables on the mini map has changed. The |setting| may be
    // NULL when called during feature initialization, so do not depend on it.
    onMapIconVisibilityChange(setting, visible) {
        const streamDistance =
            this.settings_().getValue('playground/collectable_map_icons_distance');

        for (const delegate of this.delegates_.values())
            delegate.refreshCollectableMapIcons(visible, streamDistance);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.playerManager.removeObserver(this);

        this.callbacks_.dispose();
        this.callbacks_ = null;

        for (const delegate of this.delegates_.values())
            delegate.dispose();
        
        this.delegates_.clear();
        this.delegates_ = null;

        this.settings_().removeSettingObserver(kVisibilitySetting, this);
        this.settings_.removeReloadObserver();
    }
}
