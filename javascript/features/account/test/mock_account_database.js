// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { AccountDatabase } from 'features/account/account_database.js';

// Implementation of the AccountDatabase that overrides all methods with mocked out behaviour, in
// order to avoid hitting the actual database.
export class MockAccountDatabase extends AccountDatabase {
    summary = null;
    changePassQueries = [];
    updatedValue = null;

    aliasMutation = null;
    nameMutation = null;

    constructor(...params) {
        super(...params);

        // Initialize all the summary override values to NULL, to make sure that we can use the ??
        // operator in the `getPlayerSummaryInfo` method further down.
        this.summary = {
            level: null,
            vip: null,
            onlineTime: null,
            killCount: null,
            deathCount: null,
            lastSeen: null,
        };
    }

    // Overridden.
    async getPlayerSummaryInfo(nickname) {
        if (nickname === 'NameThatDoesNotExist')
            return null;

        return {
            level: this.summary.level ?? 'Management',
            is_vip: this.summary.vip ?? true,
            online_time: this.summary.onlineTime ?? 991571,
            kill_count: this.summary.killCount ?? 15122,
            death_count: this.summary.deathCount ?? 4812,
            last_seen: this.summary.lastSeen ?? 92929
        };
    }

    // Overridden.
    async getAliases(nickname) {
        if (['FakeUser', 'AliasName', 'AmazingRicky', 'NewNick'].includes(nickname))
            return null;
        
        return {
            userId: 4050,
            nickname: '[BB]Ricky92',
            aliases: [
                'WoodPecker',
                '[BA]Ro[BB]in',
            ]
        };
    }

    // Overridden.
    async addAliasQuery(userId, alias) {
        this.aliasMutation = { userId, alias };
        return true;
    }

    // Overridden.
    async removeAliasQuery(userId, alias) {
        this.aliasMutation = { userId, alias };
        return true;
    }

    // Overridden.
    async getNicknameHistory(nickname) {
        if (nickname === 'FakeUser')
            return null;
        
        return ['[HOT]Lad1992', 'Beamer'];
    }

    // Overridden.
    async changeNameQuery(userId, nickname, newNickname) {
        this.nameMutation = { userId, nickname, newNickname };
        return true;
    }

    // Overridden.
    async _changePasswordQuery(nickname, password, databaseSalt) {
        this.changePassQueries.push({ nickname, password, databaseSalt });
        return true;
    }

    // Overridden.
    async _getPlayerFieldQuery(nickname, fieldName, field) {
        if (nickname === 'FakeUser')
            return null;
        
        switch (fieldName) {
            case 'custom_color':
                return -1991054421;  // 0x8952EBAA (w/ alpha)
            case 'kill_count':
                return 1234;
            case 'level':
                return 'Management';
            case 'money_bank_type':
                return 'Premier';
            case 'last_ip':
                return 623925203;  // 37.48.87.211
            case 'last_seen':
                return '2019-12-24 12:44:41';
            default:
                throw new Error('Field not defined for testing: ' + fieldName);
        }
    }

    // Overridden.
    _updatePlayerFieldQuery(nickname, table, column, value) {
        if (nickname === 'FakeUser')
            throw new Error(`The player ${nickname} could not be found in the database.`);

        this.updatedValue = value;
        return value;
    }
}
