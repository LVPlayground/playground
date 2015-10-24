// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// See https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Symbol
let playerCreateSymbol = Symbol('Private symbol to limit creation of Player instances.'),
    players = {};

class Player {
  // Returns the Player instance for the player with id |playerId|. If the player is not connected
  // to Las Venturas Playground, NULL will be returned instead.
  static get(playerId) {
    if (!players.hasOwnProperty(playerId))
      return null;

    return players[playerId];
  }

  // Creates a new instance of the Player class for |playerId|. This method must only be used by
  // code in this file, hence the |privateSymbol| which is deliberately not exported.
  constructor(privateSymbol, playerId) {
    if (privateSymbol != playerCreateSymbol)
      throw new Error('Please do not instantiate the Player class. Use Player.get(playerId) instead.');

    this.id_ = playerId;
    this.name_ = pawnInvoke('GetPlayerName', 'iS', playerId);
    this.ipAddress_ = pawnInvoke('GetPlayerIp', 'iS', playerId);
    this.level_ = Player.LEVEL_PLAYER;
  }

  // Returns the id of this player. This attribute is read-only.
  get id() { return this.id_; }

  // Returns or updates the name of this player. Changing the player's name is currently not
  // synchronized with the Pawn portion of the gamemode.
  get name() { return this.name_; }
  set name(value) { this.name_ = value; pawnInvoke('SetPlayerName', 'is', this.playerId, value); }

  // Returns the IP address of this player. This attribute is read-only.
  get ipAddress() { return this.ipAddress_; }

  // Returns the level of this player. Synchronized with the gamemode using the `levelchange` event.
  get level() { return this.level_; }
};

// The level of a  player. Can be accessed using the `level` property on a Player instance.
Player.LEVEL_PLAYER = 0;
Player.LEVEL_ADMINISTRATOR = 1;
Player.LEVEL_MANAGEMENT = 2;

// Called when a player connects to Las Venturas Playground. Registers the player as being in-game
// and initializes the Player instance for them.
self.addEventListener('playerconnect', event =>
  players[event.playerid] = new Player(playerCreateSymbol, event.playerid));

// Called when the level of a player changes. This event is custom to Las Venturas Playground.
self.addEventListener('playerlevelchange', event => {
  if (players.hasOwnProperty(event.playerid))
    players[event.playerid].level_ = event.level;
});

// Called when a player disconnects from the server. Removes the player from our registry.
self.addEventListener('playerdisconnect', event =>
  delete players[event.playerid]);

// Expose the Player object globally since it will be commonly used.
global.Player = Player;

exports = Player;
