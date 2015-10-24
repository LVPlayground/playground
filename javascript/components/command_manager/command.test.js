// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let Command = require('components/command_manager/command.js');

describe('Command', it => {
  it('reflects the name', assert =>
      assert.equal(new Command('foo').name, 'foo'));
  
  it('validates the parameters', assert => {
    let command = new Command('foo');

    assert.throws(() => command.setParameters({}));
    assert.throws(() => command.setParameters([{ noName: true, type: 0 }]));
    assert.throws(() => command.setParameters([{ name: 'foo', noType: true }]));

    assert.doesNotThrow(() => command.setParameters(null));
    assert.doesNotThrow(() => command.setParameters([]));
    assert.doesNotThrow(() => command.setParameters([{ name: 'bar', type: Command.PARAM_TYPE_NUMBER }]));

    // Using a custom parameter type requires a `parser` constructor to be set.
    assert.throws(() => command.setParameters([{ name: 'bar', type: Command.PARAM_TYPE_CUSTOM }]));
    assert.doesNotThrow(() =>
        command.setParameters([{ name: 'bar', type: Command.PARAM_TYPE_CUSTOM, parser: class MyParser {} }]));

    // It's not allowed for there to be any parameters after a SENTENCE one.
    assert.throws(() => command.setParameters([{ name: 'bar', type: Command.PARAM_TYPE_SENTENCE },
                                               { name: 'baz', type: Command.PARAM_TYPE_INTEGER }]));
  });

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
});
