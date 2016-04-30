// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Gang = require('features/gangs/gang.js');

const mockedGangInfo = {
    hko: {
        id: 1337,
        tag: 'HKO',
        name: 'Hello Kitty Online',
        goal: 'Spreading love and peace',
        color: 0xFF3399FF
    }
};

// Mocked version of the GangDatabase. Provides the same interface, but will result mocked
// information without actually hitting the MySQL database.
class MockGangDatabase {
    loadGangForPlayer(userId, gangId) {
        let gangInfo = null;

        switch (userId) {
            case MockGangDatabase.HKO_LEADER_USER_ID:
                gangInfo = { role: Gang.ROLE_LEADER, gang: mockedGangInfo.hko };
                break;
        }

        return Promise.resolve(gangInfo);
    }

    doesGangExists(tag, name) {
        if (tag === 'HKO')
            return Promise.resolve({ available: false, tag: 'HKO', name: 'Hello Kitty Online' });

        return Promise.resolve({ available: true });
    }

    createGangWithLeader(player, tag, name, goal) {
        if (tag === 'CC') {
            return Promise.resolve({
                id: MockGangDatabase.CC_GANG_ID,
                tag: tag,
                name: name,
                goal: goal,
                color: null
            });
        }

        return Promise.reject(new Error('No special behaviour implemented.'));
    }

    removePlayerFromGang(player, gang) {
        return Promise.resolve(true);
    }

    determineSuccessionAfterDeparture(player, gang) {
        return Promise.reject(new Error('No special behaviour implemented.'));
    }

    updateRoleForUserId(userId, gang, role) {
        return Promise.reject(new Error('No special behaviour implemented.'));
    }
}

// Magic userId values that can be used by the database.
MockGangDatabase.HKO_GANG_ID = 1337;
MockGangDatabase.HKO_LEADER_USER_ID = 42;

MockGangDatabase.CC_GANG_ID = 1000;
MockGangDatabase.CC_LEADER_USER_ID = 50;

exports = MockGangDatabase;
