// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let CommandBuilder = require('components/command_manager/command_builder.js');

describe('CommandBuilder', (it, beforeEach) => {
  let command = null,
      listener = null;

  // Reset the |command| variable before each test.
  beforeEach(() => { command = null; listener = null; });

  // Can be used as the |parent| argument for a top-level command builder. Will write the command
  // and its associated listener to respectively |command| and |listener| when build.
  let testParent = {
    registerCommand: (commandArg, listenerArg) => {
      command = commandArg;
      listener = listenerArg;
    }
  };

  // Utility function to create a new builder using |testParent| as the parent.
  let builder = (command) => new CommandBuilder(CommandBuilder.COMMAND, testParent, command);
  
  it('should keep track of the command name', assert => {
    builder('testcommand').build();

    assert.equal(command, 'testcommand');
    assert.isNotNull(listener);
  });

  it('should call the listener', assert => {
    let listenerCalled = false;

    builder('testcommand').build(() => listenerCalled = true);
    assert.isNotNull(listener);

    listener();
  });

});
