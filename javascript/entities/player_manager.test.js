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
        };

        playerManager.addObserver(myObserver);
        playerManager.notifyObservers('onPlayerConnect');

        assert.equal(counter, 1);

        playerManager.addObserver(myObserver);  // second add
        playerManager.notifyObservers('onPlayerConnect');

        assert.equal(counter, 2);

        playerManager.removeObserver(myObserver);
        playerManager.notifyObservers('onPlayerConnect');

        assert.equal(counter, 2);

        playerManager.dispose();
    });

    it('should invoke observer methods both on the object and on the prototype', assert => {
        let playerManager = new PlayerManager();

        let prototypalCounter = 0;
        let propertyCounter = 0;

        class PrototypalCounter {
            onPlayerConnect(player) {
                ++prototypalCounter;
            }
        }

        const prototypalObserver = new PrototypalCounter();
        const propertyObserver = {
            onPlayerConnect: player => ++propertyCounter
        };

        const emptyObserver = {};

        playerManager.addObserver(prototypalObserver);
        playerManager.addObserver(propertyObserver);
        playerManager.addObserver(emptyObserver);

        playerManager.onPlayerConnect({ playerid: 42 });

        assert.equal(prototypalCounter, 1);
        assert.equal(propertyCounter, 1);

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

        assert.equal(connectionCount, 1);
        assert.equal(disconnectionCount, 0);

        playerManager.onPlayerDisconnect({ playerid: 42, reason: 0 });

        assert.equal(connectionCount, 1);
        assert.equal(disconnectionCount, 1);

        let connectedPlayer = null;

        const myOtherObserver = {
            onPlayerConnect: player => connectedPlayer = player,
            onPlayerDisconnect: player => 0
        }

        playerManager.addObserver(myOtherObserver);

        playerManager.onPlayerConnect({ playerid: 42 });

        assert.isNotNull(connectedPlayer);
        assert.equal(connectionCount, 2);

        assert.equal(connectedPlayer.id, 42);

        playerManager.dispose();
    });

    it('should inform observers of level changes', assert => {
        let playerManager = new PlayerManager();
        let counter = 0;

        const myObserver = {
            onPlayerLevelChange: player => ++counter
        };

        playerManager.onPlayerConnect({ playerid: 42 });

        playerManager.addObserver(myObserver);
        playerManager.onPlayerLevelChange({ playerid: 42 });

        assert.equal(counter, 1);

        playerManager.dispose();
    });

    it('should inform observers of logins', assert => {
        let playerManager = new PlayerManager();
        let counter = 0;

        const myObserver = {
            onPlayerLogin: player => ++counter
        };

        playerManager.onPlayerConnect({ playerid: 42 });

        playerManager.addObserver(myObserver);
        playerManager.onPlayerLogin({ playerid: 42, userid: 42 });

        assert.equal(counter, 1);

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
        playerManager.createPlayer = function(playerId, event) {
            if (!playerMap.hasOwnProperty(playerId))
                throw new Error('Unexpected player connecting: ' + playerId);

            return {
                id: playerId,
                name: playerMap[playerId],
                notifyDisconnected() {}
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

        assert.equal(playerManager.count, 0);

        playerManager.onPlayerConnect({ playerid: 42 });
        playerManager.onPlayerConnect({ playerid: 15 });
        playerManager.onPlayerConnect({ playerid: 0 });

        assert.equal(playerManager.count, 3);

        playerManager.onPlayerDisconnect({ playerid: 15, reason: 0 });
        assert.equal(playerManager.count, 2);

        playerManager.onPlayerDisconnect({ playerid: 0, reason: 0 });
        assert.equal(playerManager.count, 1);

        playerManager.dispose();
    });

    it('should know about the highest connected player ID', assert => {
        let playerManager = new PlayerManager();

        assert.equal(playerManager.highestId, 0);

        playerManager.onPlayerConnect({ playerid: 5 });
        assert.equal(playerManager.highestId, 5);

        playerManager.onPlayerConnect({ playerid: 42 });
        assert.equal(playerManager.highestId, 42);

        playerManager.onPlayerConnect({ playerid: 32 });
        assert.equal(playerManager.highestId, 42);

        playerManager.onPlayerDisconnect({ playerid: 42, reason: 0 });
        assert.equal(playerManager.highestId, 32);

        playerManager.onPlayerDisconnect({ playerid: 5, reason: 0 });
        assert.equal(playerManager.highestId, 32);

        playerManager.onPlayerDisconnect({ playerid: 32, reason: 0 });
        assert.equal(playerManager.highestId, 0);

        playerManager.onPlayerConnect({ playerid: 0 });
        assert.equal(playerManager.highestId, 0);

        playerManager.onPlayerDisconnect({ playerid: 0, reason: 0 });
        assert.equal(playerManager.highestId, 0);

        playerManager.dispose();
    });

    it('should be able to iterate over the connected players', assert => {
        let playerManager = new PlayerManager();
        let count = 0;

        playerManager.forEach(player => ++count);
        assert.equal(count, 0);

        playerManager.onPlayerConnect({ playerid: 42 });
        playerManager.onPlayerConnect({ playerid: 10 });
        playerManager.onPlayerConnect({ playerid: 5 });

        playerManager.forEach(player => ++count);
        assert.equal(count, 3);

        const expectedIds = [5, 10, 42];
        let actualIds = [];

        playerManager.forEach((player, playerId) => actualIds.push(playerId));

        assert.equal(actualIds.length, 3);
        assert.deepEqual(actualIds, expectedIds);

        playerManager.dispose();
    });
});
