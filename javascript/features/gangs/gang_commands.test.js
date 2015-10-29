// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let CommandManager = require('components/command_manager/command_manager.js'),
    GangCommands = require('features/gangs/gang_commands.js');

describe('GangCommands', (it, beforeEach, afterEach) => {
  let player = null;

  beforeEach(() => player = Player.createForTest());
  afterEach(() => Player.destroyForTest(player));

  it('should parse the commands as expected', assert => {
    let createParams = null,
        inviteParams = null,
        joinParams = null,
        kickParams = null,
        leaveParams = null,
        colorParams = null,
        infoParams = null,
        gangsParams = null;

    class GangCommandsMock extends GangCommands {
      gangCreate(player, ...params) { createParams = params; }
      gangInvite(player, ...params) { inviteParams = params; }
      gangJoin(player, ...params) { joinParams = params; }
      gangKick(player, ...params) { kickParams = params; }
      gangLeave(player, ...params) { leaveParams = params; }
      gangColor(player, ...params) { colorParams = params; }
      gangInfo(player, ...params) { infoParams = params; }
      gangs(player, ...params) { gangsParams = params; }

      getCurrentGangId() { return 42; }
    };

    let commandManager = new CommandManager(true /* isTest */),
        gangCommands = new GangCommandsMock(commandManager, null);

    let executeCommand = commandText => {
      commandManager.onPlayerCommandText({ playerid: player.id,
                                           cmdtext: commandText,
                                           preventDefault: () => null });
    };

    // /pgang create [name]
    executeCommand('/pgang create');
    assert.isNull(createParams);

    executeCommand('/pgang create foobar');
    assert.deepEqual(createParams, ['foobar']);

    executeCommand('/pgang create foobar baz 42');
    assert.deepEqual(createParams, ['foobar baz 42']);

    // /pgang invite [player]
    executeCommand('/pgang invite');
    assert.isNull(inviteParams);

    executeCommand('/pgang invite foobar');
    assert.isNull(inviteParams);

    executeCommand('/pgang invite ' + player.id);
    assert.deepEqual(inviteParams, [player]);

    executeCommand('/pgang invite ' + player.name);
    assert.deepEqual(inviteParams, [player]);

    // /pgang join [id]?
    executeCommand('/pgang join');
    assert.deepEqual(joinParams, []);

    executeCommand('/pgang join foobar');
    assert.deepEqual(joinParams, []);

    executeCommand('/pgang join 42');
    assert.deepEqual(joinParams, [42]);

    // /pgang kick [player]
    executeCommand('/pgang kick');
    assert.isNull(kickParams);

    executeCommand('/pgang kick foobar');
    assert.isNull(kickParams);

    executeCommand('/pgang kick ' + player.id);
    assert.deepEqual(kickParams, [player]);

    executeCommand('/pgang kick ' + player.name);
    assert.deepEqual(kickParams, [player]);

    // /pgang leave
    executeCommand('/pgang leave');
    assert.deepEqual(leaveParams, []);

    executeCommand('/pgang leave 42');
    assert.deepEqual(leaveParams, []);

    // /pgang [id]? color
    executeCommand('/pgang color');
    assert.deepEqual(colorParams, [42]);

    executeCommand('/pgang 50 color');
    assert.deepEqual(colorParams, [50]);

    // /pgang [id]? info
    executeCommand('/pgang info');
    assert.deepEqual(infoParams, [42]);

    executeCommand('/pgang 50 info');
    assert.deepEqual(infoParams, [50]);

    // /pgangs
    executeCommand('/pgangs');
    assert.deepEqual(gangsParams, ['']);
  });

});
