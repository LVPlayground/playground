// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let Command = require('components/command_manager/command.js');

describe('Command', it => {
  it('reflects the name', assert =>
      assert.equal(new Command('foo').name, 'foo'));
/*
  it('creates a string representation', assert => {
    let command = null;

    command = new Command('foo');
    assert.equal(command.toString(), '/foo');

    command = new Command('foo', [{ name: 'bar', type: Command.PARAM_TYPE_NUMBER }]);
    assert.equal(command.toString(), '/foo [bar]');

    command = new Command('foo', [{ name: 'bar', type: Command.PARAM_TYPE_NUMBER },
                                  { name: 'baz', type: Command.PARAM_TYPE_NUMBER }]);
    assert.equal(command.toString(), '/foo [bar] [baz]');
  });
*/
});
