// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { BanDatabase } from 'features/punishments/ban_database.js';

// Implementation of the BanDatabase that overrides all methods with mocked out behaviour, in
// order to avoid hitting the actual database.
export class MockBanDatabase extends BanDatabase {
    addedEntry = null;
    unbanLogId = null;

    addedRangeExceptions = 0;
    removedRangeExceptions = 0;

    constructor(...params) {
        super(...params);
    }

    // Overridden.
    async _getLogEntriesQuery({ nickname, limit }) {
        if (nickname === 'Xanland') {
            return {
                total: 7,
                results: [
                    {
                        log_id: 3,
                        log_date: '2020-04-26 04:31:41',
                        log_type: 'ban',
                        ban_ip_range_start: 0,
                        ban_ip_range_end: 0,
                        gpci_hash: 2657120904,  // 894984A40C8E59EC45DC4E8CC088CE0DCDD8E5D9
                        ban_expiration_date: '2020-06-06 03:25:30',
                        user_nickname: 'HaloLVP',
                        subject_nickname: 'Xanland',
                        description: 'Testing serial information',
                    }
                ]
            };
        }

        return { total: 0, results: [] };
    }

    // Overridden.
    async _addEntryQuery(params) {
        this.addedEntry = params;
        return true;
    }

    // Overridden.
    async _getRecentBansQuery(limit) {
        return [
            // ID: 1, a regular IP-based ban
            {
                log_id: 1,
                log_date: '2020-04-28 20:41:12',
                log_type: 'ban',
                ban_ip_range_start: 623925203,
                ban_ip_range_end: 623925203,
                gpci_hash: 0,
                ban_expiration_date: '2020-05-06 20:41:12',
                user_nickname: '[CP]Mr.JT',
                subject_nickname: 'Halo',
                description: 'being so thorough',
            },
            // ID: 2, an IP range ban
            {
                log_id: 2,
                log_date: '2020-04-27 14:55:01',
                log_type: 'ban',
                ban_ip_range_start: 623902720,
                ban_ip_range_end: 623968255,
                gpci_hash: 0,
                ban_expiration_date: '2020-06-01 18:00:00',
                user_nickname: 'slein',
                subject_nickname: '[BB]Joe',
                description: 'Health cheat',
            },
            // ID: 3, a serial ban
            {
                log_id: 3,
                log_date: '2020-04-26 04:31:41',
                log_type: 'ban',
                ban_ip_range_start: 0,
                ban_ip_range_end: 0,
                gpci_hash: 2657120904,  // 894984A40C8E59EC45DC4E8CC088CE0DCDD8E5D9
                ban_expiration_date: '2020-06-06 03:25:30',
                user_nickname: 'HaloLVP',
                subject_nickname: 'Xanland',
                description: 'Testing serial information',
            }
        ].slice(0, limit);
    }

    // Overridden.
    async _findNicknamesQuery({ ipRangeBegin, ipRangeEnd, serial }) {
        if (ipRangeBegin === 623925203 /* 37.48.87.211 */) {
            return {
                total: 3,
                entries: [
                    { text: 'Gunther', sessions: 512 },
                    { text: 'PilotLV', sessions: 12 },
                    { text: 'PilotLC', sessions: 1 },
                ],
            };
        } else if (ipRangeBegin == 623902720 /* 37.48.0.0 */ &&
                   ipRangeEnd === 623968255 /* 37.48.255.255 */) {
            return {
                total: 48,
                entries: [
                    { text: 'Gunther', sessions: 512 },
                    { text: 'LocalBot', sessions: 71 },
                    { text: 'PilotLV', sessions: 12 },
                    { text: 'PilotSA', sessions: 12 },
                    { text: 'PilotLC', sessions: 1 },
                ],
            };
        } else if (serial === 2657120904) {
            return {
                total: 2,
                entries: [
                    { text: 'Xanland', sessions: 122 },
                    { text: 'XandeR', sessions: 8 },
                ]
            };
        }

        return {
            total: 0,
            entries: [],
        };
    }

    // Overridden.
    async _isCommonSerialQuery(serial) { return 500; }

    // Overridden.
    async findIpAddressesForNickname({ nickname, maxAge = 30 } = {}) {
        if (nickname === 'Xanland') {
            return {
                total: 13,
                entries: [
                    { text: '37.47.12.13', sessions: 15 },
                    { text: '212.87.1.1', sessions: 1 },
                ],
            };
        }

        return {
            total: 0,
            entries: [],
        };
    }

    // Overridden.
    async findSerialsForNickname({ nickname, maxAge = 30 } = {}) {
        if (nickname === 'Xanland') {
            return {
                total: 13,
                entries: [
                    { text: 2657120904, sessions: 122 },
                    { text: 5642214798, common: true, sessions: 1 },
                ],
            };
        }

        return {
            total: 0,
            entries: [],
        };
    }

    // Overridden.
    async _findActiveBansQuery({ nickname, ipRangeStart, ipRangeEnd, serial }) {
        if (nickname === '[BB]Joe' || nickname === '[BB]EvilJoe' || serial == 987654321) {
            return [
                {
                    log_id: 48561,
                    log_date: '2020-04-01 12:51:14',
                    log_type: 'ban',
                    ban_ip_range_start: 623925203,  // 37.48.87.211
                    ban_ip_range_end: 623925203,  // 37.48.87.211
                    gpci_hash: 987654321,
                    ban_expiration_date: '2020-06-01 18:00:00',
                    user_nickname: 'slein',
                    subject_nickname: '[BB]Joe',
                    description: 'Health cheat',
                },
                {
                    log_id: 39654,
                    log_date: '2020-01-16 14:55:01',
                    log_type: 'ban',
                    ban_ip_range_start: 1021343232,  // 60.224.118.0
                    ban_ip_range_end: 1021343487,  // 60.224.118.255
                    gpci_hash: 987654321,
                    ban_expiration_date: '2020-07-10 18:30:00',
                    user_nickname: 'Russell',
                    subject_nickname: '[BB]EvilJoe',
                    description: 'Infinite health??',
                },
            ];
        } else if (ipRangeStart === 623925002 /* 37.48.87.10 */ ||
                   ipRangeStart === 623924992 /* 37.48.87.0 */ ||
                   ipRangeStart === 623902720 /* 37.48.0.0 */) {
            return [
                {
                    log_id: 12894,
                    log_date: '2019-12-05 04:51:11',
                    log_type: 'ban',
                    ban_ip_range_start: 623902720,  // 37.48.0.0
                    ban_ip_range_end: 623968255,  // 37.48.255.255
                    gpci_hash: 0,
                    ban_expiration_date: '2020-06-01 18:00:00',
                    user_nickname: 'slein',
                    subject_nickname: '[BB]Joe',
                    description: 'Health cheat',
                },
            ];
        } else if (serial === 2657120904) {
            return [
                {
                    log_id: 8954,
                    log_date: '2018-01-14 14:12:59',
                    log_type: 'ban',
                    ban_ip_range_start: 0,
                    ban_ip_range_end: 0,
                    gpci_hash: 2657120904,  // 894984A40C8E59EC45DC4E8CC088CE0DCDD8E5D9
                    ban_expiration_date: '2020-06-06 03:25:30',
                    user_nickname: 'HaloLVP',
                    subject_nickname: 'Xanland',
                    description: 'Funny serial number',
                }
            ];
        } else {
            return [];  // no bans found
        }
    }

    // Overridden.
    async unban(logId) {
        this.unbanLogId = logId;
    }

    // Overridden.
    async _getRangesWithExceptionsQuery() {
        return [
            {
                ip_range_begin: 2130706432,  // 127.0.0.0
                ip_range_end: 2130771967,  // 127.0.255.255
                exception_count: 2,
            },
            {
                ip_range_begin: 623924992,  // 37.48.87.0
                ip_range_end: 623925247,  // 37.48.87.255
                exception_count: 1,
            },
        ];
    }

    // Overridden.
    async _getRangeExceptionsQuery(ipRangeStart, ipRangeEnd) {
        switch (ipRangeStart) {
            case 2130706432:  // 127.0.*.*
                return [
                    {
                        exception_id: 1,
                        exception_date: '2020-05-23 14:15:16',
                        exception_author: 'Russell',
                        exception_tally: 25,
                        nickname: 'Gunther',
                    },
                    {
                        exception_id: 3,
                        exception_date: '2020-04-11 12:08:14',
                        exception_author: '[BB]Ricky92',
                        exception_tally: 1,
                        nickname: 'TrainDriverLV',
                    },
                ];
            
            case 623924992:  // 37.48.87.*
                return [
                    {
                        exception_id: 2,
                        exception_date: '2020-05-12 18:00:01',
                        exception_author: 'Holsje',
                        exception_tally: 24,
                        nickname: 'Nuwani',
                    },
                ];
            
            default:
                return [];
        }
    }

    // Overridden.
    async addRangeException(range, nickname, author) {
        this.addedRangeExceptions++;
    }

    // Overridden.
    async removeRangeException(rangeId) {
        this.removedRangeExceptions++;
    }
}
