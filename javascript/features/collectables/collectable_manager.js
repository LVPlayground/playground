// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Achievements } from 'features/collectables/achievements.js';
import { CollectableDatabase } from 'features/collectables/collectable_database.js';
import { CollectableNotification } from 'features/collectables/collectable_notification.js';
import { MockCollectableDatabase } from 'features/collectables/test/mock_collectable_database.js';
import { RedBarrels } from 'features/collectables/red_barrels.js';
import { SprayTags } from 'features/collectables/spray_tags.js';
import { Treasures } from 'features/collectables/treasures.js';

// Identifier of the setting that controls collectable map icon visibility.
const kVisibilitySetting = 'playground/collectable_map_icons_display';

// Manages player state in regards to their collectables: tracking, statistics and maintaining. Will
// make sure that the appropriate information is available at the appropriate times.
export class CollectableManager {
    collectables_ = null;
    settings_ = null;

    database_ = null;
    delegates_ = null;
    notifications_ = new WeakMap();

    constructor(collectables, nuwani, settings) {
        this.collectables_ = collectables;
        this.settings_ = settings;
        this.settings_.addReloadObserver(
            this, CollectableManager.prototype.initializeSettingObserver.bind(this));

        this.initializeSettingObserver();

        // A mocked out database is used for testing, as we don't want to hit the actual MySQL
        // database. Logic and other shared functionality will be consistent among both.
        this.database_ = server.isTest() ? new MockCollectableDatabase()
                                         : new CollectableDatabase();

        // Create the actual collectable types, the "delegates".
        this.delegates_ = new Map([
            [ CollectableDatabase.kRedBarrel, new RedBarrels(collectables, this) ],
            [ CollectableDatabase.kSprayTag, new SprayTags(collectables, this) ],
            [ CollectableDatabase.kAchievement, new Achievements(collectables, this, nuwani) ],
            [ CollectableDatabase.kTreasures, new Treasures(collectables, this) ],
        ]);
        
        server.playerManager.addObserver(this, /* replayHistory= */ true);
    }

    // ---------------------------------------------------------------------------------------------

    // Starts observing the collectable map icon visibility setting. Will have to be re-applied each
    // time the Settings module gets reloaded.
    initializeSettingObserver() {
        this.settings_().addSettingObserver(
            kVisibilitySetting,
            this, CollectableManager.prototype.onMapIconVisibilityChange.bind(this));
    }

    // Initializes the collectable data from their JSON configuration files, and applies the current
    // configuration setting on whether collectable map icons should be shown.
    initialize() {
        for (const delegate of this.delegates_.values())
            delegate.initialize();
        
        this.onMapIconVisibilityChange(null, this.settings_().getValue(kVisibilitySetting));
    }

    // Gets the given |delegate|, or NULL when the delegate has not been loaded.
    getDelegate(delegate) { return this.delegates_.get(delegate) ?? null; }

    // ---------------------------------------------------------------------------------------------

    // Returns the number of collectables collected by the player, filtered by the given |type| when
    // given, or aggregated across all types when omitted.
    getCollectableCountForPlayer(player, filterType = null) {
        let count = 0;

        for (const [ type, delegate ] of this.delegates_) {
            if (type === CollectableDatabase.kAchievement && filterType !== type)
                continue;  // ignore achievements by default

            if (filterType === null || filterType === type)
                count += delegate.countCollectablesForPlayer(player).total;
        }

        return count;
    }

    // Marks the |collectableId| of the given |type| as having been collected by the |player|. This
    // will take immediate effect within the game, and will be stored in the database as well.
    markCollectableAsCollected(player, type, round, collectableId) {
        player.syncedData.collectables = this.getCollectableCountForPlayer(player);

        if (!player.account.isRegistered())
            return;  // the |player| does not have an account, data will not persist

        return this.database_.markCollectableForPlayer(player, type, round, collectableId);
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
            const notification = queue[0];
            const displayTime =
                this.settings_().getValue('playground/notification_display_time_sec');

            await CollectableNotification.showForPlayer(
                player, displayTime, notification.title, notification.message);
            
            await wait(displayTime * 1000 * 0.1);  // 10% of display time between notifications
            
            queue.shift();

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

            // Create all the collectables on the map for the given |player|.
            for (const [ type, delegate ] of this.delegates_) {
                if (!collectables.has(type))
                    throw new Error(`Unable to load statistics for ${player} (type: ${type}).`);

                delegate.refreshCollectablesForPlayer(player,  collectables.get(type));
            }

            // Ensure that Pawn has the latest metric on the number of collectables available for
            // the given |player|, as a number of benefits are still implemented there.
            player.syncedData.collectables = this.getCollectableCountForPlayer(player);
        });
    }

    // Called when the player in |event| has started a session as a guest, which means that none of
    // their information will persist beyond this playing session.
    onPlayerGuestSession(player) {
        for (const delegate of this.delegates_.values()) {
            delegate.refreshCollectablesForPlayer(
                player, CollectableDatabase.createDefaultCollectableStatistics());
        }
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
        this.notifications_.delete(player);

        for (const delegate of this.delegates_.values())
            delegate.clearCollectablesForPlayer(player);
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
