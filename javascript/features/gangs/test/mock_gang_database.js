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

    doesNameExist(name) {
        if (name === 'Hello Kitty Online')
            return Promise.resolve(true);

        return Promise.resolve(false);
    }

    doesTagExist(tag) {
        if (tag === 'HKO')
            return Promise.resolve(true);

        return Promise.resolve(false);
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

    getFullMemberList(gang) {
        if (gang.tag === 'CC') {
            return Promise.resolve([
                { role: Gang.ROLE_LEADER, userId: 42, username: 'Gunther' },
                { role: Gang.ROLE_MEMBER, userId: 1338, username: 'Harry' },
                { role: Gang.ROLE_MEMBER, userId: 1337, username: 'Russell' },
                { role: Gang.ROLE_MEMBER, userId: 1339, username: 'Sander' }
            ]);
        }

        if (gang.tag === 'HKO') {
            return Promise.resolve([
                { role: Gang.ROLE_MANAGER, userId: 42, username: 'Gunther' },
                { role: Gang.ROLE_MANAGER, userId: 1337, username: 'Russell' }
            ]);
        }

        if (gang.tag === 'HKO2') {
            return Promise.resolve([
                { role: Gang.ROLE_LEADER, userId: 42, username: 'Gunther' },
                { role: Gang.ROLE_LEADER, userId: 1337, username: 'Russell' }
            ]);
        }

        if (gang.tag === 'HKO3') {
            return Promise.resolve([
                { role: Gang.ROLE_LEADER, userId: 42, username: 'Gunther' },
                { role: Gang.ROLE_MEMBER, userId: 1521, username: 'OfflinePlayer' }
            ]);
        }

        return Promise.reject(new Error('No special behaviour implemented.'));
    }

    addPlayerToGang(player, gang) {
        return Promise.resolve(true);
    }

    removePlayerFromGang(userId, gang) {
        return Promise.resolve(true);
    }

    determineSuccessionAfterDeparture(player, gang) {
        if (gang.tag === 'HKO')
            return Promise.resolve(null /* the only member */);

        if (gang.tag === 'CC')
            return Promise.resolve({ userId: 42, username: 'MrNextLeader', role: 'Manager' });

        return Promise.reject(new Error('No special behaviour implemented.'));
    }

    updateRoleForUserId(userId, gang, role) {
        if (gang.tag == 'CC' && userId == 42)
            return Promise.resolve();  // `CC` case in determineSuccessionAfterDeparture()

        if (gang.tag == 'HKO' && userId == 1337)
            return Promise.resolve();  // kick member from gang through `/gang settings` case

        return Promise.reject(new Error('No special behaviour implemented.'));
    }

    updateColor(gang, color) {
        return Promise.resolve(true);
    }

    updateName(gang, name) {
        return Promise.resolve(true);
    }

    updateTag(gang, tag) {
        return Promise.resolve(true);
    }

    updateGoal(gang, goal) {
        return Promise.resolve(true);
    }
}

// Magic userId values that can be used by the database.
MockGangDatabase.HKO_GANG_ID = 1337;
MockGangDatabase.HKO_LEADER_USER_ID = 42;

MockGangDatabase.CC_GANG_ID = 1000;
MockGangDatabase.CC_LEADER_USER_ID = 50;

exports = MockGangDatabase;
