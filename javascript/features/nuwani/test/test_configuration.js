// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

export const kTestConfiguration = {
    bots: [
        { nickname: 'NuwaniJS', master: true },
    ],
    servers: [
        { ip: '127.0.0.1', port: 6667 },
    ],
    channels: [
        { channel: '#LVP.DevJS', echo: true },
    ],
    levels: [
        { mode: 'Y', level: 'management' },
        { mode: 'q', level: 'management' },
        { mode: 'a', level: 'management' },
        { mode: 'o', level: 'administrator' },
        { mode: 'h', level: 'vip' },
        { mode: 'v', level: 'vip' },
    ],
    commandPrefix: '?',
    owners: [
        'Joe!joe@lvp.administrator',
    ],
};
