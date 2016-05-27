// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Feature = require('components/feature_manager/feature.js');
const ScopedCallbacks = require('base/scoped_callbacks.js');

// Number of death messages that are visible on the player's screens.
const DEATH_FEED_VISIBLE_LENGTH = 5;

// Player Id that cannot be connected to the server, but may not equal INVALID_PLAYER_ID.
const UNASSIGNED_PLAYER_ID = 1337;

// The death feed feature powers the deaths and kills visible on the right-hand side of a player's
// screen. It provides an API that allows the feed to be disabled for certain players.
class DeathFeedFeature extends Feature {
  constructor() {
    super();

    // Set of player ids for whom the death feed is disabled.
    this.disabledPlayers_ = new Set();

    // Array of the most recent additions to the death feed. Will be limited in size to the value of
    // DEATH_FEED_VISIBLE_LENGTH. Used to restore the death feeds for players.
    this.recentDeaths_ = [];

    // Listen to the events required for reliably providing this feature.
    this.callbacks_ = new ScopedCallbacks();
    this.callbacks_.addEventListener(
        'playerresolveddeath', DeathFeedFeature.prototype.onPlayerDeath.bind(this));
    this.callbacks_.addEventListener(
        'playerdisconnect', DeathFeedFeature.prototype.onPlayerDisconnect.bind(this));
  }

  // Returns an array with the most recent deaths.
  get recentDeaths() { return this.recentDeaths_; }

  // Disables the death feed for |player|. Five fake deaths will be send to their client to clear
  // the current state of the death screen on their screens, wiping it clean.
  disableForPlayer(player) {
    this.disabledPlayers_.add(player.id);

    for (let fakeDeathIndex = 0; fakeDeathIndex < DEATH_FEED_VISIBLE_LENGTH; ++fakeDeathIndex)
      this.sendDeathMessage(player, UNASSIGNED_PLAYER_ID, Player.INVALID_ID, 0);
  }

  // Enables the death feed for |player|. The five most recent deaths will be send to their client
  // so that it accurately resembles the current state of the world again.
  enableForPlayer(player) {
    this.disabledPlayers_.delete(player.id);
    this.recentDeaths_.forEach(deathInfo =>
        this.sendDeathMessage(player, deathInfo.killee, deathInfo.killer, deathInfo.reason));
  }

  // Called when a player dies or gets killed. Will cause an update to the death feed for all online
  // players, except those for whom the death feed has been disabled. The source of this event is
  // the Pawn part of Las Venturas Playground, as the circumstances of the death may have to be
  // resolved prior to being presented to players.
  onPlayerDeath(event) {
    this.recentDeaths_.unshift({ killee: event.playerid, killer: event.killerid, reason: event.reason });
    this.recentDeaths_ = this.recentDeaths_.slice(0, DEATH_FEED_VISIBLE_LENGTH);

    server.playerManager.forEach(player => {
      if (this.disabledPlayers_.has(player.id))
        return;

      this.sendDeathMessage(player, event.playerid, event.killerid, event.reason);
    });
  }

  // Utility function to send a death message to |player|.
  sendDeathMessage(player, killee, killer, reason) {
    if (server.isTest())
      return;

    pawnInvoke('SendDeathMessageToPlayer', 'iiii', player.id, killer, killee, reason);
  }

  // Called when a player disconnects from the server. Re-enables the death feed for the player in
  // case it was previously disabled. (So that it's not disabled for future players.)
  onPlayerDisconnect(event) {
    this.disabledPlayers_.delete(event.playerid);
  }

  dispose() {
    this.disabledPlayers_ = null;

    this.callbacks_.dispose();
    this.callbacks_ = null;
  }
};

exports = DeathFeedFeature;
