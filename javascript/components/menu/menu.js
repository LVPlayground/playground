// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let EventTarget = require('base/event_target.js'),
    MenuManager = require('components/menu/menu_manager.js');

let manager = new MenuManager();

// The menu class represents a user-visible menu with up to two columns and twelve items. Each item
// should have an associated event listener that will be called when a player selects the row.
//
// Creating a menu is simple. Instantiate a new instance of this class with the menu's title and,
// optionally, the column configuration. The menu will always be centered horizontally and
// vertically on the player's screen.
//
// Menu's can be presented to a player by calling showForPlayer(), and closed again by calling
// closeForPlayer(). Players can close the menu themselves either by dismissing it, or by selecting
// a menu item, for which the 'onclose' event is available.
class Menu extends EventTarget {
  constructor(title, columns = []) {
    super();

    if (!Array.isArray(columns) || columns.length > 2)
      throw new Error('The column configuration for a menu must be an array with at most two entries.');

    // Verify that each column has at least a title (the width is optional).
    columns.forEach(column => {
      if (!column.hasOwnProperty('title'))
        throw new Error('Each column must have been assigned a title.');
    });

    this.title_ = title;
    this.columns_ = columns;
    this.items_ = [];

    // Number of players whom are currently being presented the native menu. Should only be modified
    // by the MenuManager when displaying or hiding menus for players.
    this.native_player_count_ = 0;

    // Menus will be immutable once they have been presented to a player for the first time.
    this.immutable_ = false;
  }

  // -----------------------------------------------------------------------------------------------

  // Adds a new item to the menu. This method is overloaded with two signatures:
  //     addItem(title[, listener])
  //     addItem(firstTitle, secondTitle[, listener])
  //
  // The intended function will be chosen based on the number of arguments, as well as the types of
  // the arguments (in case of the listener). Note that a menu will be considered immutable after
  // it has been presented to a player.
  addItem() {
    if (this.immutable_)
      throw new Error('The menu is immutable, it has already been presented to a player.');

    if (this.items_.length >= Menu.MAX_MENU_ITEMS)
      throw new Error('A menu must not have more than ' + Menu.MAX_MENU_ITEMS + ' items.');

    if (arguments.length == 0)
      throw new Error('At least one argument must be passed when adding an item.');

    let item = { firstTitle: arguments[0], secondTitle: '', listener: null };

    if (arguments.length == 2 && typeof arguments[1] != 'function') {
      item.secondTitle = arguments[1];
    } else if (arguments.length == 2) {
      item.listener = arguments[1];
    } else if (arguments.length > 2 && typeof arguments[2] == 'function') {
      item.secondTitle = arguments[1];
      item.listener = arguments[2];
    }

    this.items_.push(item);
  }

  // Displays the menu to |player|. Other JavaScript-owned menus will be closed.
  displayForPlayer(player) {
    if (!(player instanceof Player))
      throw new Error('The first argument to showForPlayer() must be a player.');

    // Mark the menu as being immutable.
    this.immutable_ = true;

    manager.displayMenuForPlayer(this, player);
  }

  // Closes the menu for |player| if this menu is currently being displayed to them.
  closeForPlayer(player) {
    if (!(player instanceof Player))
      throw new Error('The first argument to showForPlayer() must be a player.');

    manager.closeMenuForPlayer(this, player);
  }

  // -----------------------------------------------------------------------------------------------

  // Dispatches the "show" event to listeners for that type on this menu.
  OnShow(player) {
    this.dispatchEvent('show', {
      player: player,
      menu: this
    });
  }

  // Dispatches the "close" event to listeners for that type on this menu.
  OnClose(player) {
    this.dispatchEvent('close', {
      player: player,
      menu: this
    });
  }

  // Dispatches the "select" event to listeners for that type on this menu. If the selected item has
  // a listener of its own, that will be selected first.
  OnSelect(player, itemId) {
    if (itemId < 0 || itemId >= this.items_.length)
      throw new Error('Received an out-of-bounds item id for this menu.');

    let item = this.items_[itemId];

    if (typeof item.listener == 'function')
      item.listener(player);

    this.dispatchEvent('select', {
      player: player,
      menu: this,

      title: item.firstTitle,
      firstTitle: item.firstTitle,
      secondTitle: item.secondTitle
    });
  }
};

// The Id that will be used to represent invalid menus.
Menu.INVALID_ID = 0xFF;

// Maximum number of menus that can be created on the server.
Menu.MAX_MENU_COUNT = 128;

// Maximum number of items that can be added to a single menu.
Menu.MAX_MENU_ITEMS = 12;

exports = Menu;
