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
}

// Magic userId values that can be used by the database.
MockGangDatabase.HKO_GANG_ID = 1337;
MockGangDatabase.HKO_LEADER_USER_ID = 42;

exports = MockGangDatabase;
