// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import AbuseMonitor from 'features/abuse/abuse_monitor.js';

describe('AbuseMonitor', (it, beforeEach) => {
    let monitor = null;
    let settings = null;

    beforeEach(() => {
        monitor = server.featureManager.loadFeature('abuse').monitor_;
        settings = server.featureManager.loadFeature('settings');
    });

    it('should be able to detect and kick fake non-player characters', assert => {
        const russell = server.playerManager.getById(1 /* Russell */);

        russell.identify();
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

    it('should be able to detect and report illegal vehicle entry', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);

        russell.identify();
        russell.level = Player.LEVEL_ADMINISTRATOR;

        const vehicle = server.vehicleManager.createVehicle({
            modelId: 441,
            position: new Vector(200, 300, 50)
        });

        vehicle.lockForPlayer(gunther);

        // (1) Make sure that the abuse can be detected.
        {
            assert.isTrue(vehicle.isLockedForPlayer(gunther));

            // Force |gunther| in the |vehicle|. This roughly matches how cheats enter vehicles.
            gunther.enterVehicle(vehicle);

            // Make sure that |russell| has received a warning about the incident.
            assert.equal(russell.messages.length, 1);
            assert.isTrue(
                russell.messages[0].includes(
                    Message.format(Message.ABUSE_ANNOUNCE_DETECTED, gunther.name, gunther.id,
                                   'illegal vehicle entry', '1st')));

            // Make sure that the incident has been reported in |gunther|'s statistics.
            const statistics = monitor.getPlayerStatistics(gunther);
            assert.equal(statistics.get('illegal vehicle entry'), 1);
        }

        // (2) Make sure that the warnings setting will be respected.
        {
            settings.setValue('abuse/warning_report_limit', 10);
            assert.equal(monitor.getReportLimit(), 10);

            // Incidents should be reported up to the 10th time.
            for (let i = 2; i <= 10; ++i) {
                gunther.enterVehicle(vehicle);
                assert.equal(russell.messages.length, i);
            }

            // The next incidents should not be reported to administrators anymore.
            assert.equal(russell.messages.length, 10);

            gunther.enterVehicle(vehicle);
            gunther.enterVehicle(vehicle);
            gunther.enterVehicle(vehicle);
            gunther.enterVehicle(vehicle);

            assert.equal(russell.messages.length, 10);

            const statistics = monitor.getPlayerStatistics(gunther);
            assert.equal(statistics.get('illegal vehicle entry'), 14);
        }
    });

    it('should gather and have names for all sorts of abuse', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const types = new Set();

        for (const name of Object.getOwnPropertyNames(AbuseMonitor)) {
            if (name.startsWith('TYPE_'))
                types.add(AbuseMonitor[name]);
        }

        assert.isAbove(types.size, 0);

        // (1) Verify that all types have a description.
        {
            for (const type of types)
                assert.equal(typeof monitor.getTypeDescription(type), 'string');
        }

        // (2) Verify that most types are included in the statistics.
        {
            const statistics = monitor.getPlayerStatistics(gunther);
            const excluded = new Set([
                AbuseMonitor.TYPE_ILLEGAL_NON_PLAYER_CHARACTER,  // checked once on connect
            ]);

            for (const type of types) {
                if (excluded.has(type))
                    continue;

                assert.isTrue(statistics.has(monitor.getTypeDescription(type)));
            }
        }
    });
});
