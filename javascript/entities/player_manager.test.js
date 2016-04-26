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

    it('should be able to find players by ID', assert => {
        let playerManager = new PlayerManager();

        assert.isNull(playerManager.getById(42));

        playerManager.onPlayerConnect({ playerid: 42 });
        assert.isNotNull(playerManager.getById(42));

        playerManager.onPlayerDisconnect({ playerid: 42, reason: 0 });
        assert.isNull(playerManager.getById(42));

        playerManager.dispose();
    });

    it('should be able to find players by name', assert => {
        const playerMap = {
            42: 'Russell'
        }

        let playerManager = new PlayerManager();
        playerManager.createPlayer = function(playerId) {
            if (!playerMap.hasOwnProperty(playerId))
                throw new Error('Unexpected player connecting: ' + playerId);

            return {
                id: playerId,
                name: playerMap[playerId]
            };
        };

        assert.isNull(playerManager.getByName('Russell'));

        playerManager.onPlayerConnect({ playerid: 42 });

        assert.isNotNull(playerManager.getByName('Russell'));
        assert.isNull(playerManager.getByName('RUSSELL'));
        assert.isNull(playerManager.getByName('uSSel'));

        assert.isNotNull(playerManager.getByName('Russell', true /* fuzzy */));
        assert.isNotNull(playerManager.getByName('RUSSELL', true /* fuzzy */));
        assert.isNotNull(playerManager.getByName('uSSel', true /* fuzzy */));

        playerManager.onPlayerDisconnect({ playerid: 42, reason: 0 });

        assert.isNull(playerManager.getByName('Russell'));
        assert.isNull(playerManager.getById(42));

        playerManager.dispose();
    });

    it('should know about the number of connected players', assert => {
        let playerManager = new PlayerManager();

        assert.equal(0, playerManager.count);

        playerManager.onPlayerConnect({ playerid: 42 });
        playerManager.onPlayerConnect({ playerid: 15 });
        playerManager.onPlayerConnect({ playerid: 0 });

        assert.equal(3, playerManager.count);

        playerManager.onPlayerDisconnect({ playerid: 15, reason: 0 });
        assert.equal(2, playerManager.count);

        playerManager.onPlayerDisconnect({ playerid: 0, reason: 0 });
        assert.equal(1, playerManager.count);

        playerManager.dispose();
    });

    it('should know about the highest connected player ID', assert => {
        let playerManager = new PlayerManager();

        assert.equal(0, playerManager.highestId);

        playerManager.onPlayerConnect({ playerid: 5 });
        assert.equal(5, playerManager.highestId);

        playerManager.onPlayerConnect({ playerid: 42 });
        assert.equal(42, playerManager.highestId);

        playerManager.onPlayerConnect({ playerid: 32 });
        assert.equal(42, playerManager.highestId);

        playerManager.onPlayerDisconnect({ playerid: 42, reason: 0 });
        assert.equal(32, playerManager.highestId);

        playerManager.onPlayerDisconnect({ playerid: 5, reason: 0 });
        assert.equal(32, playerManager.highestId);

        playerManager.onPlayerDisconnect({ playerid: 32, reason: 0 });
        assert.equal(0, playerManager.highestId);

        playerManager.onPlayerConnect({ playerid: 0 });
        assert.equal(0, playerManager.highestId);

        playerManager.onPlayerDisconnect({ playerid: 0, reason: 0 });
        assert.equal(0, playerManager.highestId);

        playerManager.dispose();
    });
});
