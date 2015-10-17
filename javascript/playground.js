// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let CommandManager = require('components/command_manager/command_manager.js');

// The Playground class is the main runtime of the JavaScript implementation of the server. It owns
// the critical objects (e.g. the command manager) and features. A single instance will exist for
// the lifetime of the JavaScript runtime, available as `playground` on the global object.
class Playground {
  constructor() {
    this.commandManager_ = new CommandManager();

    // TODO(Russell): Move this to some kind of `introduction` feature.
    this.commandManager_.registerCommand('help', Playground.prototype.onHelp.bind(this));
  }

  // Returns the instance of the command manager.
  get commandManager() {
    return this.commandManager_;
  }

  // Called when |player| executes /help.
  onHelp(player, params) {
    console.log(player.name + ' executed /help!');
  }

};

exports = Playground;
