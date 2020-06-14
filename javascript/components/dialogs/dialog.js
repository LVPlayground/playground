// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The different kind of available dialogs in SA-MP.
// http://wiki.sa-mp.com/wiki/Dialog_Styles
const DIALOG_STYLE_MSGBOX = 0;
const DIALOG_STYLE_INPUT = 1;
const DIALOG_STYLE_LIST = 2;
const DIALOG_STYLE_PASSWORD = 3;
const DIALOG_STYLE_TABLIST = 4;
const DIALOG_STYLE_TABLIST_HEADERS = 5;

// The dialog class provides a mid-level abstraction layer to the dialog features of the SA-MP
// server. There are higher-level alternatives available to certain types of input dialogs that are
// better suited than this class:
//
// DIALOG_STYLE_MSGBOX          - //components/dialogs/message.js (Message)
// DIALOG_STYLE_INPUT           - //components/dialogs/question.js (Question)
// DIALOG_STYLE_LIST            - //components/menu/menu.js (Menu)
// DIALOG_STYLE_TABLIST_HEADERS - //components/menu/menu.js (Menu)
//
// Note that use of dialogs of style DIALOG_STYLE_TABLIST has been forbidden in Las Venturas
// Playground, since we mandate use of headers in tab lists.
export class Dialog {
  // Do not allow this class to be instantiated. Instead, use the static methods below.
  constructor() { throw new Error('The Dialog class must not be instantiated.'); }

  // Displays a message box to |player|. The |rightButton| will be hidden when its label is set to
  // an empty string. This method returns a promise that will resolve with the clicked-on button
  // (|response|), or reject when the player disconnects while it's being shown.
  static displayMessage(player, caption, message, leftButton, rightButton) {
    return server.dialogManager.displayForPlayer(player, DIALOG_STYLE_MSGBOX, caption, message, leftButton, rightButton).then(result => {
      return { response: result.response };
    });
  }

  // Displays an input dialog that allows the player to enter textual information.
  static displayInput(player, { caption, message, leftButton, rightButton = '', isPrivate = false } = {}) {
    const type = isPrivate ? DIALOG_STYLE_PASSWORD
                           : DIALOG_STYLE_INPUT;

    return server.dialogManager.displayForPlayer(player, type, caption, message, leftButton, rightButton).then(result => {
      return { response: result.response, text: result.inputtext };
    });
  }

  // Displays a tab list dialog with headers to |player|. The |rightButton| will be hidden when its
  // label is set to an empty string. This method will return a promise that will resolve with the
  // clicked-on button (|response|) and the selected item (|item|).
  static displayMenu(player, isList, caption, content, leftButton, rightButton) {
    let style = isList ? DIALOG_STYLE_LIST
                       : DIALOG_STYLE_TABLIST_HEADERS;

    return server.dialogManager.displayForPlayer(player, style, caption, content, leftButton, rightButton).then(result => {
      return { response: result.response, item: result.listitem };
    });
  }

};

// Id of the primary -left- button on a dialog in the SA-MP server.
Dialog.PRIMARY_BUTTON = 1;

// Id of the secondary -right- button (optional) on a dialog in the SA-MP server.
Dialog.SECONDARY_BUTTON = 0;
