// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let Account = require('features/account/account.js'),
    Feature = require('components/feature_manager/feature.js');

// The account feature provides the required abilities for persisting player information between
// multiple sessions. It also supplements a series of properties on the Player object.
class AccountFeature extends Feature {
  constructor(playground) {
    super(playground);

    // Stores the Account instances for the online players.
    this.players_ = {};

    // Called when a player logs in to their account. Triggered by the Pawn gamemode.
    global.addEventListener('playerlogin', this.__proto__.onPlayerLogin.bind(this));
    global.addEventListener('playerdisconnect', this.__proto__.onPlayerDisconnect.bind(this));

    // Provides |Player.prototype.account|. This property will be NULL for players who don't have
    // an account or haven't logged in yet, or an Account instance when they are.
    Player.provideProperty('account', this.__proto__.accountForPlayer.bind(this));

    // Provides |Player.prototype.isRegistered()|. Returns whether the player has an account.
    // TODO: Distinguish between registered and logged in players.
    Player.provideMethod('isRegistered', player => player.account !== null);
  }

  // Returns the Account instance for |player|, or NULL when they don't have any.
  accountForPlayer(player) {
    let playerId = player.id;
    if (!this.players_.hasOwnProperty(playerId))
      return null;

    return this.players_[playerId];
  }

  // Called when a player logs in to their account. An Account instance will be created for them
  // at this point, which will hold the account's information.
  onPlayerLogin(event) {
    this.players_[event.playerid] = new Account(event.userid);
  }

  // Called when a player disconnects from Las Venturas Playground. If they were logged in to their
  // account, all traces of it will be removed from the local state.
  onPlayerDisconnect(event) {
    delete this.players_[event.playerid];
  }
};

exports = AccountFeature;
