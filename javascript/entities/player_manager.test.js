// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const PlayerManager = require('entities/player_manager.js');

describe('PlayerManager', it => {
    it('should deduplicate attached observers', assert => {
        let playerManager = new PlayerManager();
        let counter = 0;

        const myObserver = {
            onPlayerConnect: player => ++counter,
            onPlayerDisconnect: player => ++counter
        };

        playerManager.addObserver(myObserver);
        playerManager.notifyPlayerConnected(null);

        assert.equal(1, counter);

        playerManager.addObserver(myObserver);  // second add
        playerManager.notifyPlayerConnected(null);

        assert.equal(2, counter);

        playerManager.removeObserver(myObserver);
        playerManager.notifyPlayerConnected(null);

        assert.equal(2, counter);

        playerManager.dispose();
    });

    it('should inform observers of connecting and disconnecting players', assert => {
        let playerManager = new PlayerManager();

        let connectionCount = 0;
        let disconnectionCount = 0;

        const myObserver = {
            onPlayerConnect: player => ++connectionCount,
            onPlayerDisconnect: player => ++disconnectionCount
        };

        playerManager.addObserver(myObserver);
        playerManager.onPlayerConnect({ playerid: 42 });

        assert.equal(1, connectionCount);
        assert.equal(0, disconnectionCount);

        playerManager.onPlayerDisconnect({ playerid: 42, reason: 0 });

        assert.equal(1, connectionCount);
        assert.equal(1, disconnectionCount);

        let connectedPlayer = null;

        const myOtherObserver = {
            onPlayerConnect: player => connectedPlayer = player,
            onPlayerDisconnect: player => 0
        }

        playerManager.addObserver(myOtherObserver);

        playerManager.onPlayerConnect({ playerid: 42 });

        assert.isNotNull(connectedPlayer);
        assert.equal(2, connectionCount);

        assert.equal(42, connectedPlayer.id);

        playerManager.dispose();
    });
});
