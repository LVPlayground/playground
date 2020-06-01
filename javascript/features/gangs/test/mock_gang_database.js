// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Gang from 'features/gangs/gang.js';
import GangDatabase from 'features/gangs/gang_database.js';

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
                    balance: 0,
                    balanceAccess: GangDatabase.kAccessLeaderAndManagers,
                    skinId: 42
                };
                break;

            case MockGangDatabase.HKO_LEADER_USER_ID:
                gangInfo = { 
                    role: Gang.ROLE_LEADER, 
                    useGangColor: true, 
                    gang: mockedGangInfo.hko,
                    balance: 0,
                    balanceAccess: GangDatabase.kAccessEveryone,
                    skinId: 42 
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
                balance: 0,
                balanceAccess: GangDatabase.kAccessLeaderAndManagers,
                color: null,
                chatEncryptionExpiry: 0,
                skinId: 42
            };
        }

        throw new Error('No special behaviour implemented for "' + tag + '".');
    }

    async getFullMemberList(gang) {
        if (gang.tag === 'CC') {
            return [
                {
                    role: Gang.ROLE_LEADER,
                    userId: 42,
                    username: 'Gunther',
                    lastSeen: new Date()
                },
                {
                    role: Gang.ROLE_MEMBER,
                    userId: 1338,
                    username: 'Harry',
                    lastSeen: new Date(Date.now() - 14 * 86400 * 1000)
                },
                {
                    role: Gang.ROLE_MEMBER,
                    userId: 1337,
                    username: 'Russell',
                    lastSeen: new Date(Date.now() - 65 * 86400 * 1000)
                },
                {
                    role: Gang.ROLE_MEMBER,
                    userId: 1339,
                    username: 'Sander',
                    lastSeen: new Date(Date.now() - 720 * 86400 * 1000)
                }
            ];
        }

        if (gang.tag === 'HKO') {
            return [
                { role: Gang.ROLE_MANAGER, userId: 42, username: 'Gunther', lastSeen: new Date() },
                { role: Gang.ROLE_MANAGER, userId: 1337, username: 'Russell', lastSeen: new Date() }
            ];
        }

        if (gang.tag === 'HKO2') {
            return [
                { role: Gang.ROLE_LEADER, userId: 42, username: 'Gunther', lastSeen: new Date() },
                { role: Gang.ROLE_LEADER, userId: 1337, username: 'Russell', lastSeen: new Date() }
            ];
        }

        if (gang.tag === 'HKO3') {
            return [
                { role: Gang.ROLE_LEADER, userId: 42, username: 'Gunther', lastSeen: new Date() },
                { role: Gang.ROLE_MEMBER, userId: 1521, username: 'OfflinePlayer',
                  lastSeen: new Date() }
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

    async updateBalanceAccess(gang, access) {}

    async getBalance(gangId) {
        return 25000000;
    }

    async getTransactionLog(gangId, limit) {
        return [
            {
                date: new Date('2020-05-24 12:11:51'),
                amount: -215000,
                reason: 'Daily maintenance fee',
                username: null,
            },
            {
                date: new Date('2020-05-23 15:38:51'),
                amount: -1000000,
                reason: 'Personal withdrawal',
                username: 'Russell',
            },
            {
                date: new Date('2020-05-21 11:59:01'),
                amount: 25000000,
                reason: 'Personal contribution',
                username: 'Russell',
            },
        ];
    }

    async processTransaction(gangId, userId, amount, reason) {}
}

// Magic userId values that can be used by the database.
MockGangDatabase.HKO_GANG_ID = 1337;
MockGangDatabase.HKO_MEMBER_USER_ID = 41;
MockGangDatabase.HKO_LEADER_USER_ID = 42;

MockGangDatabase.CC_GANG_ID = 1000;
MockGangDatabase.CC_LEADER_USER_ID = 50;

export default MockGangDatabase;
