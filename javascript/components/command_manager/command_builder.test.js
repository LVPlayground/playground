// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const CommandBuilder = require('components/command_manager/command_builder.js');

describe('CommandBuilder', (it, beforeEach) => {
  let command = null,
      listener = null;

  let player = null,
      lastMessage = null;

  beforeEach(() => {
    player = server.playerManager.getById(0);
    player.sendMessage = (message, ...args) => {
      if (message instanceof Message)
        lastMessage = Message.format(message, ...args);
      else
        lastMessage = message;
    };

    command = null;
    listener = null;
    lastMessage = null;
  });

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
    listener(player, '');

    assert.isTrue(listenerCalled);
  });

  it('should call the listener for sub-commands', assert => {
    let listenerCalled = false;

    builder('testcommand')
        .sub('option')
            .sub('foobar').build(() => listenerCalled = true)
            .build()
        .build();

    assert.isNotNull(listener);
    listener(player, 'option foobar');

    assert.isTrue(listenerCalled);
    listenerCalled = false;

    listener(player, 'option  foobar');

    assert.isTrue(listenerCalled);
  });

  it('should propagate number parameters', assert => {
    let parameterValue = null;

    builder('testcommand')
        .sub(CommandBuilder.NUMBER_PARAMETER).build((player, value) => parameterValue = value)
        .build();

    assert.isNotNull(listener);
    listener(player, '42');

    assert.strictEqual(parameterValue, 42);

    let parameterValues = null;

    builder('testcommand')
        .sub(CommandBuilder.NUMBER_PARAMETER)
            .sub('foobar')
                .sub(CommandBuilder.NUMBER_PARAMETER).build((player, first, second) => parameterValues = [first, second])
                .build()
            .sub('double')
                .sub(CommandBuilder.NUMBER_PARAMETER).build((player, first, second) => parameterValues = [first * 2, second * 2])
                .build()
            .build()
        .build();

    listener(player, 'foobar');
    assert.isNull(parameterValues);

    listener(player, '42 foobar 58');
    assert.deepEqual(parameterValues, [42, 58]);

    listener(player, '12 double 24');
    assert.deepEqual(parameterValues, [24, 48]);
  });

  it('should propagate word parameters', assert => {
    let parameterValues = null;

    builder('testcommand')
        .sub('foobar')
            .sub(CommandBuilder.WORD_PARAMETER)
                .sub(CommandBuilder.NUMBER_PARAMETER)
                    .build((player, value, multiplier) => parameterValues = [value, multiplier])
                .build((player, value) => parameterValues = [value])
            .build()
        .sub(CommandBuilder.WORD_PARAMETER).build((player, value) => parameterValues = [value])
        .build();

    listener(player, 'foobar');
    assert.isNull(parameterValues);

    listener(player, 'foobar baz');
    assert.deepEqual(parameterValues, ['baz']);

    listener(player, 'foo');
    assert.deepEqual(parameterValues, ['foo']);

    listener(player, 'foobar 42');
    assert.deepEqual(parameterValues, ['42']);

    listener(player, 'foobar baz 42');
    assert.deepEqual(parameterValues, ['baz', 42]);
  });

  it('should propagate player parameters', assert => {
    let parameterSubject = null;

    builder('testcommand')
        .sub(CommandBuilder.PLAYER_PARAMETER).build((player, subject) => parameterSubject = subject)
        .sub(CommandBuilder.NUMBER_PARAMETER)
            .sub(CommandBuilder.PLAYER_PARAMETER).build((player, value, subject) => parameterSubject = subject)
            .build()
        .sub(CommandBuilder.WORD_PARAMETER)
            .sub(CommandBuilder.PLAYER_PARAMETER).build((player, value, subject) => parameterSubject = subject)
            .build()
        .build();

    listener(player, '0');
    assert.equal(parameterSubject, player);

    parameterSubject = null;

    listener(player, player.name);
    assert.equal(parameterSubject, player);

    parameterSubject = null;

    assert.isNull(server.playerManager.getById(42));
    assert.isTrue(listener(player, '42 0'));
    assert.isNull(parameterSubject);

    parameterSubject = null;

    assert.isNull(server.playerManager.find({ nameOrId: 'foobar', returnPlayer: true }));
    assert.isTrue(listener(player, 'foobar ' + player.name));
    assert.isNull(parameterSubject, player);
  });

  it('should check for ambiguity of sub-commands', assert => {
    assert.throws(() => builder('testcommand').sub(CommandBuilder.SENTENCE_PARAMETER).build());

    assert.throws(() => builder('testcommand').sub('option').build()
                                              .sub('option').build()
                                              .build());

    assert.throws(() => {
      builder('testcommand').sub(CommandBuilder.NUMBER_PARAMETER, () => 42)
                                .sub('option').build()
                                .build()
                            .sub('option')
                            .build();
    });

    assert.throws(() => {
      builder('testcommand').sub('option').build()
                            .sub(CommandBuilder.NUMBER_PARAMETER, () => 42)
                                .sub('option').build()
                                .build()
                            .build();
    });

    assert.throws(() => {
      builder('testcommand').sub(CommandBuilder.NUMBER_PARAMETER).build()
                            .sub(CommandBuilder.NUMBER_PARAMETER).build()
                            .build();
    });

    assert.throws(() => {
      builder('testcommand').sub(CommandBuilder.WORD_PARAMETER).build()
                            .sub('foobar').build();
    });
  });

  it('should validate and apply default values', assert => {
    assert.throws(() => builder('testcommand').sub('option', () => 42));
    assert.throws(() => builder('testcommand').sub(CommandBuilder.NUMBER_PARAMETER, 42));

    let numberValue = null;

    builder('testcommand')
        .sub(CommandBuilder.NUMBER_PARAMETER, () => 42)
            .sub('foobar').build((player, number) => numberValue = number)
            .build()
        .build();

    listener(player, 'foobar');
    assert.strictEqual(numberValue, 42);

    listener(player, '12 foobar');
    assert.strictEqual(numberValue, 12);

    let wordValues = null;

    builder('testcommand')
        .sub(CommandBuilder.WORD_PARAMETER)
            .sub(CommandBuilder.WORD_PARAMETER, () => 'baz').build((player, first, second) => wordValues = [first, second])
            .build()
        .build();

    listener(player, 'subcommand');
    assert.deepEqual(wordValues, ['subcommand', 'baz']);

    listener(player, 'hello subcommand');
    assert.deepEqual(wordValues, ['hello', 'subcommand']);
  });

  it('should restrict values to player levels', assert => {
    let invoked = false;

    builder('testcommand')
        .restrict(Player.LEVEL_ADMINISTRATOR)
        .build(player => invoked = true);

    listener(player, '');
    assert.isFalse(invoked);

    player.identify();
    player.level = Player.LEVEL_ADMINISTRATOR;

    listener(player, '');
    assert.isTrue(invoked);

    player.level = Player.LEVEL_MANAGEMENT;
    invoked = false;

    listener(player, '');
    assert.isTrue(invoked);

    let state = null;

    builder('testcommand')
        .sub('foobar')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .sub('baz')
                .restrict(Player.LEVEL_MANAGEMENT)
                .build(() => state = 1)
            .build(() => state = 2)
        .build(() => state = 3);

    player.level = Player.LEVEL_PLAYER;

    listener(player, 'foobar baz');
    assert.equal(state, 3);

    player.level = Player.LEVEL_ADMINISTRATOR;

    listener(player, 'foobar baz');
    assert.equal(state, 2);

    player.level = Player.LEVEL_MANAGEMENT;

    listener(player, 'foobar baz');
    assert.equal(state, 1);

    player.level = Player.LEVEL_PLAYER;

    builder('testcommand')
        .restrict(Player.LEVEL_MANAGEMENT)
        .build();

    listener(player, '');
    assert.equal(Message.filter(lastMessage), 'Error: Sorry, this command is only available to Management members.');

    builder('testcommand')
        .restrict(Player.LEVEL_ADMINISTRATOR)
        .build();

    listener(player, '');
    assert.equal(Message.filter(lastMessage), 'Error: Sorry, this command is only available to administrators.');
  });

  it('should restrict values to functions', assert => {
    let counter = 0;
    let invoked = 0;

    function IsEvenInvocation(player) {
        return (++counter % 2) == 0;
    }

    builder('testcommand')
        .restrict(IsEvenInvocation)
        .build(player => invoked++);

    listener(player, '');
    assert.equal(invoked, 0);

    listener(player, '');
    assert.equal(invoked, 1);

    listener(player, '');
    assert.equal(invoked, 1);

    listener(player, '');
    assert.equal(invoked, 2);
  });

  it('should not be able to restrict to player levels when a function has been set', assert => {
    assert.throws(() => {
      builder('testcommand')
          .restrict(player => true)
          .restrict(Player.LEVEL_MANAGEMENT);
    });
  });

  it('should parse and apply parameters', assert => {
    assert.throws(() => builder('testcommand').parameters(null));
    assert.throws(() => builder('testcommand').parameters({}));
    assert.throws(() => builder('testcommand').parameters([ 'hello' ]));
    assert.throws(() => builder('testcommand').parameters([ {} ]));
    assert.throws(() => builder('testcommand').parameters([ { name: 'foo', type: 1337 } ]));

    assert.throws(() => {
      builder('testcommand')
          .parameters([{ name: 'foo', type: CommandBuilder.NUMBER_PARAMETER }])
          .parameters([{ name: 'bar', type: CommandBuilder.NUMBER_PARAMETER }])
          .build();
    });

    let parameterBar = null,
        parameterBoo = null;

    builder('testcommand')
        .sub('foo')
            .parameters([{ name: 'bar', type: CommandBuilder.NUMBER_PARAMETER }])
            .build((player, bar) => parameterBar = bar)
        .sub('baz')
            .parameters([{ name: 'boo', type: CommandBuilder.SENTENCE_PARAMETER, optional: true }])
            .build((player, boo) => parameterBoo = boo)
        .build();

    listener(player, 'foo 42');
    assert.isNull(lastMessage);
    assert.strictEqual(parameterBar, 42);

    listener(player, 'foo');
    assert.equal(Message.filter(lastMessage), 'Usage: /testcommand foo [bar]');

    lastMessage = null;

    listener(player, 'baz 42');
    assert.isNull(lastMessage);
    assert.strictEqual(parameterBoo, '42');

    listener(player, 'baz');
    assert.isNull(lastMessage);
    assert.isUndefined(parameterBoo);

    let parameterFoo = null;

    builder('testcommand')
        .parameters([{ name: 'foo', type: CommandBuilder.WORD_PARAMETER }])
        .build((player, foo) => parameterFoo = foo);

    listener(player, 'bar');
    assert.isNull(lastMessage);
    assert.equal(parameterFoo, 'bar');

    listener(player, 'baz hello');
    assert.isNull(lastMessage);
    assert.equal(parameterFoo, 'baz');

    parameterFoo = null;

    listener(player, '');
    assert.equal(Message.filter(lastMessage), 'Usage: /testcommand [foo]');
    assert.isNull(parameterFoo);
  });

});
