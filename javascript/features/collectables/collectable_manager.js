// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CollectableDatabase } from 'features/collectables/collectable_database.js';
import { CollectableNotification } from 'features/collectables/collectable_notification.js';
import { MockCollectableDatabase } from 'features/collectables/test/mock_collectable_database.js';
import { RedBarrels } from 'features/collectables/red_barrels.js';
import { SprayTags } from 'features/collectables/spray_tags.js';

// Identifier of the setting that controls collectable map icon visibility.
const kVisibilitySetting = 'playground/collectable_map_icons_display';

// Manages player state in regards to their collectables: tracking, statistics and maintaining. Will
// make sure that the appropriate information is available at the appropriate times.
export class CollectableManager {
    collectables_ = null;
    settings_ = null;

    database_ = null;
    delegates_ = null;
    notifications_ = null;
    statistics_ = new WeakMap();

    constructor(collectables, settings) {
        this.collectables_ = collectables;
        this.settings_ = settings;
        this.settings_.addReloadObserver(
            this, CollectableManager.prototype.initializeSettingObserver.bind(this));

        this.database_ = server.isTest() ? new MockCollectableDatabase()
                                         : new CollectableDatabase();

        this.notifications_ = new WeakMap();

        this.delegates_ = new Map([
            [ CollectableDatabase.kRedBarrel, new RedBarrels(collectables, this) ],
            [ CollectableDatabase.kSprayTag, new SprayTags(collectables, this) ],
        ]);
        
        server.playerManager.addObserver(this, /* replayHistory= */ true);
    }

    initializeSettingObserver() {
        this.settings_().addSettingObserver(
            kVisibilitySetting,
            this, CollectableManager.prototype.onMapIconVisibilityChange.bind(this));
    }

    initialize() {
        this.initializeSettingObserver();

        for (const delegate of this.delegates_.values())
            delegate.initialize();
        
        this.onMapIconVisibilityChange(null, this.settings_().getValue(kVisibilitySetting));
    }

    // Gets the given |delegate|, or NULL when the delegate has not been loaded.
    getDelegate(delegate) { return this.delegates_.get(delegate) ?? null; }

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

    // Marks the |collectableId| of the given |type| as having been collected by the |player|. This
    // will take immediate effect within the game, and will be stored in the database as well.
    markCollectableAsCollected(player, type, collectableId) {
        if (!this.statistics_.has(player))
            return;  // the |player|'s data hasn't loaded yet
        
        const collectables = this.statistics_.get(player);
        if (!collectables.has(type))
            throw new Error(`Invalid collectable type given: ${type}`);
        
        const data = collectables.get(type);
        if (data.collectedRound.has(collectableId))
            throw new Error(`The player (${player}) already collected the ${type} type.`);

        data.collected.add(collectableId);
        data.collectedRound.add(collectableId);

        player.syncedData.collectables = this.getCollectableCountForPlayer(player);

        if (!player.account.isRegistered())
            return;  // the |player| does not have an account, data will not persist

        return this.database_.markCollectableForPlayer(player, type, data.round, collectableId);
    }

    // Shows a notification to the |player| with the given |title| and |message. Will wait until
    // the existing notification has finished displaying before being presented on screen.
    async showNotification(player, title, message) {
        if (!this.notifications_.has(player))
            this.notifications_.set(player, new Array());
        
        const queue = this.notifications_.get(player);

        // Always push the notification to the end of the queue.
        queue.push({ title, message });

        // If there still are other notifications in the queue, append the new one and exit. The
        // previous notification(s) will eventually end up clearing the queue.
        if (queue.length > 1)
            return;

        // Otherwise asynchronously clear the queue. This code path should only be executed once at
        // a time for a given player, as further notifications will be added to the queue instead.
        while (queue.length) {
            const notification = queue.shift();
            const displayTime =
                this.settings_().getValue('playground/notification_display_time_sec');

            await CollectableNotification.showForPlayer(
                player, displayTime, notification.title, notification.message);
            
            await wait(displayTime * 1000 * 0.1);  // 10% of display time between notifications
            
            if (!player.isConnected())
                return;
        }
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
    onPlayerGuestSession(player) {
        this.statistics_.set(player, this.database_.createDefaultCollectablesMap());

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

    // Called when the |player| disconnects from the server. All collectables will be removed, as
    // most involve per-player objects rather than global ones.
    onPlayerDisconnect(player) {
        for (const delegate of this.delegates_.values())
            delegate.clearCollectablesForPlayer(player);
        
        this.statistics_.delete(player);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.playerManager.removeObserver(this);

        for (const delegate of this.delegates_.values())
            delegate.dispose();
        
        this.delegates_.clear();
        this.delegates_ = null;

        this.settings_().removeSettingObserver(kVisibilitySetting, this);
        this.settings_.removeReloadObserver();
    }
}
