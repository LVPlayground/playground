// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { BanDatabase } from 'features/punishments/ban_database.js';

// Implementation of the BanDatabase that overrides all methods with mocked out behaviour, in
// order to avoid hitting the actual database.
export class MockBanDatabase extends BanDatabase {
    addedEntry = null;

    constructor(...params) {
        super(...params);
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
}
