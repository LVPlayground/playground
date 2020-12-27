// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { SAMPCACNatives } from 'features/sampcac/sampcac_natives.js';

import { kReportRateLimitMs } from 'features/sampcac/detector_monitor.js';

describe('DetectorMonitor', (it, beforeEach) => {
    let gunther = null;
    let monitor = null;
    let russell = null;

    beforeEach(async () => {
        const feature = server.featureManager.loadFeature('sampcac');

        gunther = server.playerManager.getById(/* Gunther= */ 0);
        monitor = feature.detectorMonitor_;
        russell = server.playerManager.getById(/* Russell= */ 1);
        russell.level = Player.LEVEL_ADMINISTRATOR;

        await russell.identify();
    });

    // Issues a cheat detection for the given |player|, who's hereby been suspected of using the
    // given |cheat|. The optional |param0| and |param1| parameters may be used as well.
    function reportCheat(player, cheat, param0 = 0, param1 = 0) {
        dispatchEvent('cac_oncheatdetect', {
            player_id: player.id,
            cheat_id: cheat,
            opt1: param0,
            opt2: param1,
        });
    }

    it('should filter out the known false-positives before issuing a report', async (assert) => {
        // Volume keys are often mistakingly identified as macros.
        reportCheat(gunther, SAMPCACNatives.kCheatMacro, /* VK_VOLUME_DOWN= */ 174);
        reportCheat(gunther, SAMPCACNatives.kCheatMacro, /* VK_VOLUME_UP= */ 175);

        assert.equal(russell.messages.length, 0);
    });

    it('should report detected cheats to players, with a rate limiting', async (assert) => {
        // Five immediately subsequent aimbot responses should be coalesced into one.
        reportCheat(gunther, SAMPCACNatives.kCheatAimbot);
        reportCheat(gunther, SAMPCACNatives.kCheatAimbotAlternative);
        reportCheat(gunther, SAMPCACNatives.kCheatAimbotAlternative);
        reportCheat(gunther, SAMPCACNatives.kCheatAimbot);
        reportCheat(gunther, SAMPCACNatives.kCheatAimbotAlternative2);

        assert.equal(russell.messages.length, 1);

        // After the rate limit has expired, new reports should go through automatically.
        await server.clock.advance(kReportRateLimitMs);

        reportCheat(gunther, SAMPCACNatives.kCheatAimbot);
        reportCheat(gunther, SAMPCACNatives.kCheatAimbotAlternative);
        reportCheat(gunther, SAMPCACNatives.kCheatAimbotAlternative);

        assert.equal(russell.messages.length, 2);
    });
});
