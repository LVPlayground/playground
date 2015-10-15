// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let Player = require('entities/player.js');

// The menu manager is responsible for keeping track of which menus exist and
// are currently being displayed to players, providing the dynamic system for
// creating and destroying menus on demand.
class MenuManager {
  constructor() {
    this.instance_to_native_map_ = new Map();
    this.player_to_instance_map_ = new Map();

    // Listen to the events necessary to provide reliable menu manager functionality.
    // TODO(Russell): We should have some kind of weak event listeners.
    global.addEventListener('playerdisconnect', event => this.onPlayerDisconnect(event));
    global.addEventListener('playerexitedmenu', event => this.onPlayerExitedMenu(event));
    global.addEventListener('playerselectedmenurow', event => this.onPlayerSelectedMenuRow(event));
  }

  // Displays |menu| for |player|. If |player| is currently being displayed another JavaScript-
  // owned menu, it will be automatically closed.
  displayMenuForPlayer(menu, player) {
    if (this.player_to_instance_map_.has(player))
      this.closeMenuForPlayer(this.player_to_instance_map_.get(player), player);

    this.player_to_instance_map_.set(player, menu);

    if (!this.instance_to_native_map_.has(menu))
      this.instance_to_native_map_.set(menu, this.createNativeMenu(menu));

    let menuId = this.instance_to_native_map_.get(menu);

    pawnInvoke("ShowMenuForPlayer", "ii", menuId, player.id);

    // Dispatch the |show| event to listeners attached to the menu.
    menu.OnShow(player);

    ++menu.native_player_count_;
  }

  // Closes |menu| for |player|, but only if |player| is actually being displayed |menu|. If the
  // |silent| flag evaluates to true, only the local state will be pruned.
  closeMenuForPlayer(menu, player, silent) {
    if (!this.instance_to_native_map_.has(menu) || !this.player_to_instance_map_.has(player))
      return;

    let menuId = this.instance_to_native_map_.get(menu);
    let playerMenuId = this.player_to_instance_map_.get(player);

    if (menuId != playerMenuId)
      return;

    this.player_to_instance_map_.delete(player);
    if (!silent) {
      pawnInvoke("HideMenuForPlayer", "ii", menuId, player.id);
      menu.OnClose(player);
    }

    --menu.native_player_count_;
    if (menu.native_player_count_ == 0)
      destroyNativeMenu(menu, menuId);
  }

  // Creates |menu| as a native SA-MP menu and returns the ID of the menu as created. An error will
  // be thrown if the menu could not be created because of SA-MP's menu limit.
  createNativeMenu(menu) {
    // TODO: Calculate width and positioning.
    let x = 150.0, y = 150.0;

    let firstWidth = 100.0, secondWidth = 100.0;

    let menuId = pawnInvoke("CreateMenu", "siffff", menu.title_, 1, x, y, firstWidth, secondWidth);
    if (menuId == 0xFF)
      throw new Error('Unable to create a native SA-MP menu.');

    menu.items_.forEach(item => {
      pawnInvoke("AddMenuItem", "iis", menuId, 0, item.firstTitle);
    });

    return menuId;
  }

  // Destroyes |menu| as a native SA-MP menu.
  destroyNativeMenu(menu, menuId) {
    this.instance_to_native_map_.delete(menu);

    pawnInvoke("DestroyMenu", "i", menuId);
  }

  // Called when a player disconnects from the server. Any menu that may be showing for them will be
  // closed silently, freeing the menu itself if it is not necessary anymore.
  onPlayerDisconnect(event) {
    let player = Player.get(event.playerid);
    if (!this.player_to_instance_map_.has(player))
      return;

    this.closeMenuForPlayer(this.player_to_instance_map_.get(player), player, true /* silent */);
  }

  // Called when a player has exited a menu without selecting an item.
  onPlayerExitedMenu(event) {
    let player = Player.get(event.playerid);
    if (!this.player_to_instance_map_.has(player))
      return;

    let menu = this.player_to_instance_map_.get(player);
    menu.OnClose(player);
  }

  // Called when a player has selected a row on a given menu.
  onPlayerSelectedMenuRow(event) {
    let player = Player.get(event.playerid);
    if (!this.player_to_instance_map_.has(player))
      return;

    let menu = this.player_to_instance_map_.get(player);
    menu.OnSelect(player, event.row);
  }

};

exports = MenuManager;
