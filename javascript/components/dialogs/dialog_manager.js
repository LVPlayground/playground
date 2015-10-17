// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let Player = require('entities/player.js'),
    PlayerDisconnectError = require('base/errors/player_disconnect_error.js');

// The dialog manager manages allocation of the dialog ids to individual dialogs that should be
// shown to users. The SA-MP server imposes a maximum of 32767 dialogs to exist at any given time,
// but the dynamic nature of JavaScript allows us to intelligently get around that.
//
// This interface should not be used directly, except by the Dialog class and by tests. Creating
// multiple instances may cause duplicate dialog ids to be given out.
class DialogManager {
  constructor() {
    this.dialogs_ = {};
    this.playerDialogs_ = {};

    // Attach the global event listeners which we need to reliably handle dialog responses.
    // TODO(Russell): We need a weak event binding model for events like these.
    global.addEventListener('dialogresponse', DialogManager.prototype.onDialogResponse.bind(this));
    global.addEventListener('playerdisconnect', DialogManager.prototype.onPlayerDisconnect.bind(this));
  }

  // Displays a dialog for |player|. This method will return a promise that will resolve when the
  // player responds to the dialog, and reject when the player disconnects while it's showing.
  displayForPlayer(player, style, caption, contents, leftButton, rightButton) {
    if (!(player instanceof Player))
      throw new Error('Dialogs can only be shown to instances of the Player object.');

    let dialogId = this.allocateDialogId(),
        playerId = player.id;

    this.playerDialogs_[playerId] = dialogId;

    return new Promise((resolve, reject) => {
      if (!pawnInvoke('ShowPlayerDialog', 'iiissss', playerId, dialogId, style, caption, contents, leftButton, rightButton))
        throw new Error('Unable to show the dialog on the SA-MP server.');

      this.dialogs_[dialogId] = { resolve: resolve, reject: reject };
    });
  }

  // Called when |event.playerid| has selected an option from the dialog. All available information
  // will be passed through when resolving the promise - it's up to the Dialog class to provide
  // further abstractions to the intended type of dialog.
  onDialogResponse(event) {
    let dialogId = event.dialogid;
    if (!this.dialogs_.hasOwnProperty(dialogId))
      return;

    // Resolve the promise with the relevant data from the event.
    this.dialogs_[dialogId].resolve({
      response: event.response,
      listitem: event.listitem,
      inputtext: event.inputtext
    });

    delete this.playerDialogs_[event.playerid];
    delete this.dialogs_[dialogId];
  }

  // Called when |event.playerid| has disconnected from the server. Any dialogs shown from them
  // should be cleaned up appropriately, and their promises should be rejected.
  onPlayerDisconnect(event) {
    let playerId = event.playerid;
    if (!this.playerDialogs_.hasOwnProperty(playerId))
      return;

    let dialogId = this.playerDialogs_[playerId];
    if (this.dialogs_.hasOwnProperty(dialogId)) {
      // Reject the promise with a PlayerDisconnectError.
      this.dialogs_[dialogId].reject(new PlayerDisconnectError);

      delete this.dialogs_[dialogId];
    }

    delete this.playerDialogs_[playerId];
  }

  // Allocates a dialog id to be used for a new dialog. An exception will be thrown when the entire
  // pool of available dialog ids has run dry (this should never happen).
  allocateDialogId() {
    let dialogId = DialogManager.MIN_DIALOG_ID;
    while (this.dialogs_.hasOwnProperty(dialogId)) {
      if (dialogId > DialogManager.MAX_DIALOG_ID)
        throw new Error('Pool of available dialog ids has run out.');

      ++dialogId;
    }

    return dialogId;
  }
};

// The lowest dialog id that is under the control of the DialogManager.
DialogManager.MIN_DIALOG_ID = 25000;

// The highest dialog id that is under the control of the DialogManager.
DialogManager.MAX_DIALOG_ID = 30000;

exports = DialogManager;
