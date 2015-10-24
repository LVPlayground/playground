// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Identifier, stored as an IP address, that can be used to detect players created for testing.
const TEST_PLAYER_IDENTIFIER = '0.0.0.0';

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

  // -----------------------------------------------------------------------------------------------
  // The following methods are only meant for testing!

  // Simulates connecting of a player optionally identified by id |name| for the purposes of tests.
  // Make sure to also call |destroyForTest| after the test is complete to remove the player again.
  static createForTest(playerId, nickname) {
    playerId = playerId || 0;

    if (players.hasOwnProperty(playerId))
      throw new Error('Unable to create a player for testing purposes, id ' + playerId + ' already taken.');

    players[playerId] = new Player(playerCreateSymbol, playerId);
    players[playerId].name_ = nickname || 'TestPlayer';
    players[playerId].ipAddress_ = TEST_PLAYER_IDENTIFIER;

    return players[playerId];
  }

  // Destroys the player instance of |playerId| for the purposes of testing. The associated player
  // must have been created by a test as well, otherwise an exception will be thrown.
  static destroyForTest(player) {
    if (!players.hasOwnProperty(player.id))
      throw new Error('No player with this id has connected to the server.');

    if (player.ipAddress != TEST_PLAYER_IDENTIFIER)
      throw new Error('The player with this id was not created by a test.');

    delete players[player.id];
  }
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
  if (!players.hasOwnProperty(event.playerid))
    return;

  switch(event.newlevel) {
    case 2:  // AdministratorLevel
      players[event.playerid].level_ = Player.LEVEL_ADMINISTRATOR;
      break;
    case 3:  // ManagementLevel
      players[event.playerid].level_ = Player.LEVEL_MANAGEMENT;
      break;
    default:
      players[event.playerid].level_ = Player.LEVEL_PLAYER;
      break;
  }
});

// Called when a player disconnects from the server. Removes the player from our registry.
self.addEventListener('playerdisconnect', event =>
    delete players[event.playerid]);

// Expose the Player object globally since it will be commonly used.
global.Player = Player;

exports = Player;
