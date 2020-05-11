// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Gang from 'features/gangs/gang.js';

const mockedGangInfo = {
    hko: {
        id: 1337,
        tag: 'HKO',
        name: 'Hello Kitty Online',
        goal: 'Spreading love and peace',
        color: 0xFF3399FF,
        chatEncryptionExpiry: 0
    }
};

// Mocked version of the GangDatabase. Provides the same interface, but will result mocked
// information without actually hitting the MySQL database.
class MockGangDatabase {
    async loadGangForPlayer(userId, gangId) {
        let gangInfo = null;

        switch (userId) {
            case MockGangDatabase.HKO_MEMBER_USER_ID:
                gangInfo = { 
                    role: Gang.ROLE_MEMBER, 
                    useGangColor: false,
                    gang: mockedGangInfo.hko,
                    skinId: 80085
                };
                break;

            case MockGangDatabase.HKO_LEADER_USER_ID:
                gangInfo = { 
                    role: Gang.ROLE_LEADER, 
                    useGangColor: true, 
                    gang: mockedGangInfo.hko,
                    skinId: 80085 
                };
                break;
        }

        return gangInfo;
    }

    async doesGangExists(tag, name) {
        if (tag === 'HKO')
            return { available: false, tag: 'HKO', name: 'Hello Kitty Online' };

        return { available: true };
    }

    async doesNameExist(name) {
        return name === 'Hello Kitty Online';
    }

    async doesTagExist(tag) {
        return tag === 'HKO';
    }

    async createGangWithLeader(player, tag, name, goal) {
        if (['CC', 'GT', 'hKo'].includes(tag)) {
            return {
                id: MockGangDatabase.CC_GANG_ID,
                tag: tag,
                name: name,
                goal: goal,
                color: null,
                chatEncryptionExpiry: 0,
                skinId: 80085
            };
        }

        throw new Error('No special behaviour implemented for "' + tag + '".');
    }

    async getFullMemberList(gang) {
        if (gang.tag === 'CC') {
            return [
                { role: Gang.ROLE_LEADER, userId: 42, username: 'Gunther' },
                { role: Gang.ROLE_MEMBER, userId: 1338, username: 'Harry' },
                { role: Gang.ROLE_MEMBER, userId: 1337, username: 'Russell' },
                { role: Gang.ROLE_MEMBER, userId: 1339, username: 'Sander' }
            ];
        }

        if (gang.tag === 'HKO') {
            return [
                { role: Gang.ROLE_MANAGER, userId: 42, username: 'Gunther' },
                { role: Gang.ROLE_MANAGER, userId: 1337, username: 'Russell' }
            ];
        }

        if (gang.tag === 'HKO2') {
            return [
                { role: Gang.ROLE_LEADER, userId: 42, username: 'Gunther' },
                { role: Gang.ROLE_LEADER, userId: 1337, username: 'Russell' }
            ];
        }

        if (gang.tag === 'HKO3') {
            return [
                { role: Gang.ROLE_LEADER, userId: 42, username: 'Gunther' },
                { role: Gang.ROLE_MEMBER, userId: 1521, username: 'OfflinePlayer' }
            ];
        }

        throw new Error('No special behaviour implemented.');
    }

    async addPlayerToGang(player, gang) {}

    async removePlayerFromGang(userId, gang) {}

    async determineSuccessionAfterDeparture(player, gang) {
        if (gang.tag === 'HKO')
            return null /* the only member */;

        if (gang.tag === 'CC')
            return { userId: 42, username: 'MrNextLeader', role: 'Manager' };

        throw new Error('No special behaviour implemented.');
    }

    async updateRoleForUserId(userId, gang, role) {
        if (gang.tag == 'CC' && userId == 42)
            return;  // `CC` case in determineSuccessionAfterDeparture()

        if (gang.tag == 'HKO' && userId == 1337)
            return;  // kick member from gang through `/gang settings` case

        throw new Error('No special behaviour implemented.');
    }

    async purchaseChatEncryption(gang, player, encryptionTime) {}

    async updateColor(gang, color) {}

    async updateSkinId(gang, skinId) {}

    async updateColorPreference(gang, player, useGangColor) {}

    async updateName(gang, name) {}

    async updateTag(gang, tag) {}

    async updateGoal(gang, goal) {}
}

// Magic userId values that can be used by the database.
MockGangDatabase.HKO_GANG_ID = 1337;
MockGangDatabase.HKO_MEMBER_USER_ID = 41;
MockGangDatabase.HKO_LEADER_USER_ID = 42;

MockGangDatabase.CC_GANG_ID = 1000;
MockGangDatabase.CC_LEADER_USER_ID = 50;

export default MockGangDatabase;
