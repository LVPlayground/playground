// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The text draw manager keeps track of which text draws are being displayed to which users.
class TextDrawManager {
  constructor() {
    // Object keeping track of all in-game players and their associated text-draws.
    this.players_ = {};

    // Listen to the `playerdisconnect` event to clear state of leaving players.
    global.addEventListener('playerdisconnect', this.__proto__.onPlayerDisconnect.bind(this));
  }

  // Creates |textDraw| for |player| unless it's already being displayed. Returns NULL when the text
  // draw is already visible for the player, or a number when it has just been created.
  createForPlayer(player, textDraw) {
    let playerId = player.id;
    if (!this.players_.hasOwnProperty(playerId))
      this.players_[playerId] = new Map();

    if (this.players_[playerId].has(textDraw))
      return null;

    // Create the text draw on the SA-MP server, which will send it to the player's client.
    let textDrawId = pawnInvoke('CreatePlayerTextDraw', 'iffs', playerId, ...textDraw.position, textDraw.text);

    this.players_[playerId].set(textDraw, textDrawId);
    return textDrawId;
  }

  // Hides |textDraw| from |player| if it's being displayed. Returns whether the |textDraw| was
  // visible for them, and it was removed from their screen successfully.
  hideForPlayer(player, textDraw) {
    let playerId = player.id;
    if (!this.players_.hasOwnProperty(playerId))
      return false;

    if (!this.players_[playerId].has(textDraw))
      return false;

    let textDrawId = this.players_[playerId].get(textDraw);

    pawnInvoke('PlayerTextDrawDestroy', 'ii', playerId, textDrawId);

    this.players_[playerId].delete(textDraw);
    return true;
  }

  // Called when a player disconnects from the server. Clears out all state for the player.
  onPlayerDisconnect(event) {
    delete this.players_[event.playerid];
  }
};

exports = TextDrawManager;
