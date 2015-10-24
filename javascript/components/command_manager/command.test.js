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
        command.setParameters([{ name: 'bar', type: Command.PARAM_TYPE_CUSTOM, parser: function MyParser() {} }]));

    // It's not allowed for there to be any parameters after a SENTENCE one.
    assert.throws(() => command.setParameters([{ name: 'bar', type: Command.PARAM_TYPE_SENTENCE },
                                               { name: 'baz', type: Command.PARAM_TYPE_NUMBER }]));
  });

  it('validates and parses number parameters', assert => {
    let command = null,
        value = null;

    command = new Command('foo', [
        { name: 'value', type: Command.PARAM_TYPE_NUMBER }
    ], (player, argValue) => {
      value = argValue;
    });

    command.dispatch(null /* player */, '42');  // positive integer
    assert.strictEqual(value, 42);

    command.dispatch(null /* player */, '-42');  // negative integer
    assert.strictEqual(value, -42);

    command.dispatch(null /* player */, '42.50');  // positive decimal
    assert.strictEqual(value, 42.50);

    command.dispatch(null /* player */, '-42.50');  // negative decimal
    assert.strictEqual(value, -42.50);

    // Integer command parsing should not care about whitespace.
    command.dispatch(null /* player */, '      42        ');
    assert.strictEqual(value, 42);

    // Push a second argument to test parsing of subsequent integer parameters.
    let first, second;

    command = new Command('foo', [
        { name: 'value', type: Command.PARAM_TYPE_NUMBER },
        { name: 'second', type: Command.PARAM_TYPE_NUMBER }
    ], (player, firstArg, secondArg) => {
      first = firstArg;
      second = secondArg
    });

    command.dispatch(null /* player */, '50 62');
    assert.strictEqual(first, 50);
    assert.strictEqual(second, 62);

    command.dispatch(null /* player */, '      52          64    ');
    assert.strictEqual(first, 52);
    assert.strictEqual(second, 64);

    command.dispatch(null /* player */, ' 80.12  -52.12 ');
    assert.strictEqual(first, 80.12);
    assert.strictEqual(second, -52.12);
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
