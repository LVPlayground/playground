// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const MockPlayer = require('entities/test/mock_player.js');
const PlayerManager = require('entities/player_manager.js');

describe('PlayerManager', (it, beforeEach, afterEach) => {
    let manager = null;

    beforeEach(() => manager = new PlayerManager(MockPlayer /* playerConstructor */));
    afterEach(() => manager.dispose());

    it('should deduplicate attached observers', assert => {
        let counter = 0;

        class MyObserver {
            onPlayerConnect() { ++counter; }
        }

        const myObserver = new MyObserver();

        manager.addObserver(myObserver);
        manager.notifyObservers('onPlayerConnect');

        assert.equal(counter, 1);

        manager.addObserver(myObserver);  // second add
        manager.notifyObservers('onPlayerConnect');

        assert.equal(counter, 2);

        manager.removeObserver(myObserver);
        manager.notifyObservers('onPlayerConnect');

        assert.equal(counter, 2);
    });

    it('should fire past events for newly attached observers', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.identify();

        let connectionCounter = 0;
        let loginCounter = 0;

        class MyObserver {
            onPlayerConnect() { ++connectionCounter; }
            onPlayerLogin() { ++loginCounter; }
        }

        server.playerManager.addObserver(new MyObserver(), false /* replayHistory */);

        assert.equal(connectionCounter, 0);
        assert.equal(loginCounter, 0);

        server.playerManager.addObserver(new MyObserver(), true /* replayHistory */);

        assert.equal(connectionCounter, server.playerManager.count);
        assert.equal(loginCounter, 1);
    });

    it('should inform observers of connecting and disconnecting players', assert => {
        let connectionCount = 0;
        let disconnectionCount = 0;

        class MyObserver {
            onPlayerConnect() { ++connectionCount; }
            onPlayerDisconnect() { ++disconnectionCount; }
        }

        const myObserver = new MyObserver();

        manager.addObserver(myObserver);
        manager.onPlayerConnect({ playerid: 42 });

        assert.equal(connectionCount, 1);
        assert.equal(disconnectionCount, 0);

        manager.onPlayerDisconnect({ playerid: 42, reason: 0 });

        assert.equal(connectionCount, 1);
        assert.equal(disconnectionCount, 1);

        let connectedPlayer = null;

        class MyOtherObserver {
            onPlayerConnect(player) { connectedPlayer = player; }
        }

        const myOtherObserver = new MyOtherObserver();

        manager.addObserver(myOtherObserver);

        manager.onPlayerConnect({ playerid: 42 });

        assert.isNotNull(connectedPlayer);
        assert.equal(connectionCount, 2);

        assert.equal(connectedPlayer.id, 42);
    });

    it('should inform observers of level changes', assert => {
        let counter = 0;

        class MyObserver {
            onPlayerLevelChange() { ++counter; }
        }

        manager.onPlayerConnect({ playerid: 42 });

        manager.addObserver(new MyObserver());
        manager.onPlayerLevelChange({ playerid: 42 });

        assert.equal(counter, 1);
    });

    it('should inform observers of logins', assert => {
        let counter = 0;

        class MyObserver {
            onPlayerLogin() { ++counter; }
        }

        manager.onPlayerConnect({ playerid: 42 });

        manager.addObserver(new MyObserver());
        manager.onPlayerLogin({ playerid: 42, userid: 42 });

        assert.equal(counter, 1);
    });

    it('should store all information associated to a login with the player', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        assert.isFalse(gunther.isRegistered());
        assert.isFalse(gunther.isVip());

        server.playerManager.onPlayerLogin({
            playerid: gunther.id,
            userid: 42,
            vip: 1
        });

        assert.isTrue(gunther.isRegistered());
        assert.isTrue(gunther.isVip())
    });

    it('should be able to find players by ID', assert => {
        assert.isNull(manager.getById(42));

        manager.onPlayerConnect({ playerid: 42 });
        assert.isNotNull(manager.getById(42));

        manager.onPlayerDisconnect({ playerid: 42, reason: 0 });
        assert.isNull(manager.getById(42));
    });

    it('should be able to find players by name', assert => {
        assert.isNull(manager.getByName('Russell'));

        manager.onPlayerConnect({ playerid: 42, name: 'Russell' });

        assert.isNotNull(manager.getByName('Russell'));
        assert.isNull(manager.getByName('RUSSELL'));
        assert.isNull(manager.getByName('uSSel'));

        assert.isNotNull(manager.getByName('Russell', true /* fuzzy */));
        assert.isNotNull(manager.getByName('RUSSELL', true /* fuzzy */));
        assert.isNotNull(manager.getByName('uSSel', true /* fuzzy */));

        manager.onPlayerDisconnect({ playerid: 42, reason: 0 });

        assert.isNull(manager.getByName('Russell'));
        assert.isNull(manager.getById(42));
    });

    // TODO(Russell): Properly test the find() method.

    it('should know about the number of connected players', assert => {
        assert.equal(manager.count, 0);

        manager.onPlayerConnect({ playerid: 42 });
        manager.onPlayerConnect({ playerid: 15 });
        manager.onPlayerConnect({ playerid: 0 });

        assert.equal(manager.count, 3);

        manager.onPlayerDisconnect({ playerid: 15, reason: 0 });
        assert.equal(manager.count, 2);

        manager.onPlayerDisconnect({ playerid: 0, reason: 0 });
        assert.equal(manager.count, 1);
    });

    it('should be able to iterate over the connected players', assert => {
        let count = 0;

        manager.forEach(player => ++count);
        assert.equal(count, 0);

        manager.onPlayerConnect({ playerid: 42 });
        manager.onPlayerConnect({ playerid: 10 });
        manager.onPlayerConnect({ playerid: 5 });

        manager.forEach(player => ++count);
        assert.equal(count, 3);

        const expectedIds = [42, 10, 5];
        let actualIds = [];

        manager.forEach((player, playerId) => actualIds.push(playerId));

        assert.equal(actualIds.length, 3);
        assert.deepEqual(actualIds, expectedIds);
    });

    it('should inform observers of players entering and leaving vehicles', assert => {
        let enteredCounter = 0;
        let leftCounter = 0;

        class MyObserver {
            onPlayerEnterVehicle(player, vehicle) { enteredCounter++; }
            onPlayerLeaveVehicle(player, vehicle) { leftCounter++; }
        }

        server.playerManager.addObserver(new MyObserver());

        assert.equal(enteredCounter, 0);
        assert.equal(leftCounter, 0);

        const gunther = server.playerManager.getById(0 /* Gunther */);
        const vehicle = server.vehicleManager.createVehicle({
            modelId: 412 /* Infernus */,
            position: new Vector(1000, 1500, 2000)  
        });

        assert.isTrue(gunther.enterVehicle(vehicle));

        assert.equal(enteredCounter, 1);
        assert.equal(leftCounter, 0);

        assert.isTrue(gunther.leaveVehicle());

        assert.equal(enteredCounter, 1);
        assert.equal(leftCounter, 1);

        assert.isTrue(gunther.enterVehicle(vehicle));

        assert.equal(enteredCounter, 2);
        assert.equal(leftCounter, 1);

        gunther.disconnect();

        assert.equal(enteredCounter, 2);
        assert.equal(leftCounter, 2);
    });

    it('should keep track of the occupants of a particular vehicle', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);

        assert.isNull(gunther.vehicle);
        assert.isNull(gunther.vehicleSeat);

        assert.isNull(russell.vehicle);
        assert.isNull(russell.vehicleSeat);

        const vehicle = server.vehicleManager.createVehicle({
            modelId: 412 /* Infernus */,
            position: new Vector(1000, 1500, 2000)  
        });

        assert.isFalse(vehicle.isOccupied());
        assert.equal(vehicle.occupantCount, 0);
        assert.isNull(vehicle.driver);

        assert.equal([...vehicle.getOccupants()].length, 0);
        assert.equal([...vehicle.getPassengers()].length, 0);

        // (1) Make |gunther| enter the vehicle as the driver.
        assert.isTrue(gunther.enterVehicle(vehicle, Vehicle.SEAT_DRIVER));

        assert.equal(gunther.vehicle, vehicle);
        assert.equal(gunther.vehicleSeat, Vehicle.SEAT_DRIVER);

        assert.isTrue(vehicle.isOccupied());
        assert.equal(vehicle.occupantCount, 1);
        assert.equal(vehicle.driver, gunther);

        assert.equal([...vehicle.getOccupants()].length, 1);
        assert.equal([...vehicle.getPassengers()].length, 0);

        // (2) Make |russell| enter the vehicle as a passenger.
        assert.isTrue(russell.enterVehicle(vehicle, Vehicle.SEAT_PASSENGER));

        assert.equal(russell.vehicle, vehicle);
        assert.equal(russell.vehicleSeat, Vehicle.SEAT_PASSENGER);

        assert.isTrue(vehicle.isOccupied());
        assert.equal(vehicle.occupantCount, 2);
        assert.equal(vehicle.driver, gunther);

        assert.equal([...vehicle.getOccupants()].length, 2);
        assert.equal([...vehicle.getPassengers()].length, 1);

        // (3) Make |gunther| leave the vehicle, leaving |russell| by himself.
        assert.isTrue(gunther.leaveVehicle());

        assert.isNull(gunther.vehicle);
        assert.isNull(gunther.vehicleSeat);

        assert.isTrue(vehicle.isOccupied());
        assert.equal(vehicle.occupantCount, 1);
        assert.isNull(vehicle.driver);

        assert.equal([...vehicle.getOccupants()].length, 1);
        assert.equal([...vehicle.getPassengers()].length, 1);

        // (4) Make |russell| leave the vehicle as well.
        assert.isTrue(russell.leaveVehicle());

        assert.isNull(russell.vehicle);
        assert.isNull(russell.vehicleSeat);

        assert.isFalse(vehicle.isOccupied());
        assert.equal(vehicle.occupantCount, 0);
        assert.isNull(vehicle.driver);

        assert.equal([...vehicle.getOccupants()].length, 0);
        assert.equal([...vehicle.getPassengers()].length, 0);
    });

    it('should remove a player from their vehicle when they disconnect', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        assert.isNull(gunther.vehicle);
        assert.isNull(gunther.vehicleSeat);

        const vehicle = server.vehicleManager.createVehicle({
            modelId: 412 /* Infernus */,
            position: new Vector(1000, 1500, 2000)  
        });

        assert.isFalse(vehicle.isOccupied());
        assert.equal(vehicle.occupantCount, 0);
        assert.isNull(vehicle.driver);

        assert.equal([...vehicle.getOccupants()].length, 0);
        assert.equal([...vehicle.getPassengers()].length, 0);

        // (1) Make |gunther| enter the vehicle as the driver.
        assert.isTrue(gunther.enterVehicle(vehicle, Vehicle.SEAT_DRIVER));

        assert.equal(gunther.vehicle, vehicle);
        assert.equal(gunther.vehicleSeat, Vehicle.SEAT_DRIVER);

        assert.isTrue(vehicle.isOccupied());
        assert.equal(vehicle.occupantCount, 1);
        assert.equal(vehicle.driver, gunther);

        assert.equal([...vehicle.getOccupants()].length, 1);
        assert.equal([...vehicle.getPassengers()].length, 0);

        // (2) Disconnect |gunther| from the server.
        gunther.disconnect();

        assert.isNull(gunther.vehicle);
        assert.isNull(gunther.vehicleSeat);

        assert.isFalse(vehicle.isOccupied());
        assert.equal(vehicle.occupantCount, 0);
        assert.isNull(vehicle.driver);

        assert.equal([...vehicle.getOccupants()].length, 0);
        assert.equal([...vehicle.getPassengers()].length, 0);
    });
});
