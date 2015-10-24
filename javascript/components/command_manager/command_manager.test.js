// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let CommandManager = require('components/command_manager/command_manager.js'),
    Player = require('entities/player.js');

describe('CommandManager', (it, beforeEach, afterEach) => {
  let commandManager = null,
      player = null;

  // Create a new CommandManager instance, in testing mode, for each test that'll run. Also connects
  // a fake player that can be used to mimic a player executing the commands.
  beforeEach(() => {
    commandManager = new CommandManager(true /* isTest */);
    player = Player.createForTest();
  });

  // Destroys the temporary player that was created for the command manager test.
  afterEach(() => Player.destroyForTest(player));

  // Simulates that |player| executes |command| on the Command Manager.
  let executeCommand = (player, command) => {
    commandManager.onPlayerCommandText({ playerid: player.id,
                                         cmdtext: command,
                                         preventDefault: () => 0 });
  };

  it('should disallow duplicate commands', assert => {
    commandManager.registerCommand('mycommand', Player.LEVEL_PLAYER, null, null);
    assert.throws(() =>
        commandManager.registerCommand('mycommand', Player.LEVEL_PLAYER, null, null));
  });
});
