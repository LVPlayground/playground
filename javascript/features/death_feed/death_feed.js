// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Feature } from 'components/feature_manager/feature.js';
import { ScopedCallbacks } from 'base/scoped_callbacks.js';

// Number of death messages that are visible on the player's screens.
const kDeathFeedVisibleMessageCount = 5;

// Player Id that cannot be connected to the server, but may not equal INVALID_PLAYER_ID.
const kUnassignedPlayerId = 1337;

// The death feed feature powers the deaths and kills visible on the right-hand side of a player's
// screen. It provides an API that allows the feed to be disabled for certain players.
export default class DeathFeed extends Feature {
    callbacks_ = null;
    disabledPlayers_ = null;
    recentDeaths_ = null;

    constructor() {
        super();

        // Set of players for whom the death feed is disabled.
        this.disabledPlayers_ = new WeakSet();

        // Array of the most recent additions to the death feed. Will be limited in size to the
        // value of kDeathFeedVisibleMessageCount. Used to restore the death feeds for players.
        this.recentDeaths_ = [];

        this.callbacks_ = new ScopedCallbacks();
        this.callbacks_.addEventListener(
            'playerresolveddeath', DeathFeed.prototype.onPlayerDeath.bind(this));
        this.callbacks_.addEventListener(
            'playerdisconnect', DeathFeed.prototype.onPlayerDisconnect.bind(this));
    }

    // Returns an array with the most recent deaths.
    get recentDeaths() { return this.recentDeaths_; }

    // Disables the death feed for |player|. Five fake deaths will be send to their client to clear
    // the current state of the death screen on their screens, wiping it clean.
    disableForPlayer(player) {
        this.disabledPlayers_.add(player);

        for (let index = 0; index < kDeathFeedVisibleMessageCount; ++index)
            this.sendDeathMessage(player, kUnassignedPlayerId, Player.kInvalidId, 0);
    }

    // Enables the death feed for |player|. The five most recent deaths will be send to their client
    // so that it accurately resembles the current state of the world again.
    enableForPlayer(player) {
        this.disabledPlayers_.delete(player);

        for (const { killee, killer, reason } of this.recentDeaths_)
            this.sendDeathMessage(player, killee, killer, reason);
    }

    // Called when a player dies or gets killed. Will cause an update to the death feed for all
    // players, except those for whom the death feed has been disabled. The source of this event is
    // the Pawn part of Las Venturas Playground, as the circumstances of the death may have to be
    // resolved prior to being presented to players.
    onPlayerDeath(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player)
            return;  // bail out if the |killerid| has since disconnected.

        this.recentDeaths_.unshift({
            killee: event.playerid,
            killer: event.killerid,
            reason: event.reason
        });

        this.recentDeaths_ = this.recentDeaths_.slice(0, kDeathFeedVisibleMessageCount);

        // TODO: This needs to live in a better place.
        {
            if (player && player.isSelectingObject())
                player.cancelEdit();
        }

        for (const recipient of server.playerManager) {
            if (recipient.isNonPlayerCharacter())
                continue;  // don't waste cpu cycles on NPCs
            
            if (this.disabledPlayers_.has(recipient))
                continue;  // they've opted out of death messages
            
            this.sendDeathMessage(recipient, event.playerid, event.killerid, event.reason);
        }
    }

    // Utility function to send a death message to |player|.
    sendDeathMessage(player, killee, killer, reason) {
        pawnInvoke('SendDeathMessageToPlayer', 'iiii', player.id, killer, killee, reason);
    }

    // Called when a player disconnects from the server. Re-enables the death feed for the player in
    // case it was previously disabled. (So that it's not disabled for future players.)
    onPlayerDisconnect(event) {
        const player = server.playerManager.getById(event.playerid);
        if (player)
            this.disabledPlayers_.delete(player);
    }

    dispose() {
        this.disabledPlayers_ = null;

        this.callbacks_.dispose();
        this.callbacks_ = null;
    }
}
