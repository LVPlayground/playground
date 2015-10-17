// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let DialogManager = require('components/dialogs/dialog_manager.js');

// The different kind of available dialogs in SA-MP.
// http://wiki.sa-mp.com/wiki/Dialog_Styles
const DIALOG_STYLE_MSGBOX = 0;
const DIALOG_STYLE_INPUT = 1;
const DIALOG_STYLE_LIST = 2;
const DIALOG_STYLE_PASSWORD = 3;
const DIALOG_STYLE_TABLIST = 4;
const DIALOG_STYLE_TABLIST_HEADERS = 5;

// Private instance of the dialog manager, forcing all users to go through the
// static methods provided on the Dialog class.
let manager = new DialogManager();

// The dialog class provides a mid-level abstraction layer to the dialog features of the SA-MP
// server. You should not use this class directly, instead consider using one of the high-level
// abstractions for dialogs:
//
// DIALOG_STYLE_MSGBOX          - [[NOT IMPLEMENTED]]
// DIALOG_STYLE_INPUT           - [[NOT IMPLEMENTED]]
// DIALOG_STYLE_PASSWORD        - [[NOT IMPLEMENTED]]
// DIALOG_STYLE_LIST            - //components/menu/menu.js (Menu)
// DIALOG_STYLE_TABLIST_HEADERS - //components/menu/menu.js (Menu)
//
// Note that use of dialogs of style DIALOG_STYLE_TABLIST has been forbidden in Las Venturas
// Playground, since we mandate use of headers in tab lists.
class Dialog {
  // Do not allow this class to be instantiated. Instead, use the static methods below.
  constructor() { throw new Error('The Dialog class must not be instantiated.'); }

  // Displays a tab list dialog with headers to |player|. The |rightButton| will be hidden when its
  // label is set to an empty string. This method will return a promise that will resolve with the
  // clicked-on button (|response|) and the selected item (|item|).
  static displayMenu(player, isList, caption, content, leftButton, rightButton = '') {
    let style = isList ? DIALOG_STYLE_LIST
                       : DIALOG_STYLE_TABLIST_HEADERS;

    return manager.displayForPlayer(player, style, caption, content, leftButton, rightButton).then(result => {
      return { response: result.response, item: result.listitem };
    });
  }

};

// Id of the primary -left- button on a dialog in the SA-MP server.
Dialog.PRIMARY_BUTTON = 1;

// Id of the secondary -right- button (optional) on a dialog in the SA-MP server.
Dialog.SECONDARY_BUTTON = 0;

exports = Dialog;
