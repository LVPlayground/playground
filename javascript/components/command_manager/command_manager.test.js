// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let CommandManager = require('components/command_manager/command_manager.js');

describe('CommandManager', (it, beforeEach, afterEach) => {
  let commandManager = null;

  // Create a new CommandManager instance for each test, and make sure that the manager is disposed
  // of after each test has finished.
  beforeEach(() => commandManager = new CommandManager());
  afterEach(() => commandManager.disposeForTests());

  it('should disallow duplicates', assert => {
    commandManager.registerCommand('mycommand', null, () => 0);
    assert.throws(() =>
      commandManager.registerCommand('mycommand', null, () => 0));
  });
});
