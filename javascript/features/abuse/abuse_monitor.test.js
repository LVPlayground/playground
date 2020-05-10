// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { AbuseMonitor } from 'features/abuse/abuse_monitor.js';

describe('AbuseMonitor', (it, beforeEach) => {
    return;  // disabled for now

    let monitor = null;
    let settings = null;

    beforeEach(() => {
        monitor = server.featureManager.loadFeature('abuse').monitor_;
        settings = server.featureManager.loadFeature('settings');
    });

    it('should be able to detect and kick fake non-player characters', assert => {
        const russell = server.playerManager.getById(1 /* Russell */);

        russell.level = Player.LEVEL_ADMINISTRATOR;

        // Connect the evil bot to the server. They should be kicked immediately after.
        server.playerManager.onPlayerConnect({
            playerid: 42,
            name: 'EvilBot',
            ip: '42.42.42.42',
            npc: true
        });

        assert.isNull(server.playerManager.getById(42 /* evilbot */));

        assert.equal(russell.messages.length, 1);
        assert.isTrue(
            russell.messages[0].includes(
                Message.format(Message.ABUSE_ANNOUNCE_KICKED, 'EvilBot', 42,
                               'illegal non-player character')));

    });

});
