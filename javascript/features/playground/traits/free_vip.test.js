// Copyright 2017 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { PlaygroundManager } from 'features/playground/playground_manager.js';

describe('FreeVip', (it, beforeEach, afterEach) => {
    let gunther = null;
    let manager = null;
    let settings = null;

    beforeEach(() => {
        settings = server.featureManager.loadFeature('settings');
        manager = new PlaygroundManager(() => settings);
        manager.initialize();

        gunther = server.playerManager.getById(0 /* Gunther */);
    });

    afterEach(() => manager.dispose());

    it('should grant VIP to registered players without VIP', async assert => {
        settings.setValue('decorations/holidays_free_vip', true);
        await gunther.identify({ vip: 0 });

        assert.isFalse(gunther.isVip());

        await server.clock.advance(10000 /* 10 seconds, twice the feature's wait */);
        assert.isTrue(gunther.isVip());
        assert.pawnCall('OnGrantVipToPlayer');

        assert.equal(gunther.messages.length, 3);
        assert.isTrue(gunther.messages[0].startsWith('Surprise!'));
    });

    it('should not grant VIP to registered players with VIP', async assert => {
        settings.setValue('decorations/holidays_free_vip', true);
        await gunther.identify({ vip: 1 });

        assert.isTrue(gunther.isVip());

        await server.clock.advance(10000 /* 10 seconds, twice the feature's wait */);
        assert.isTrue(gunther.isVip());

        assert.equal(gunther.messages.length, 0);
    });

    it('should not grand VIP to unregistered players', async assert => {
        settings.setValue('decorations/holidays_free_vip', true);

        assert.isFalse(gunther.isVip());

        await server.clock.advance(10000 /* 10 seconds, twice the feature's wait */);
        assert.isFalse(gunther.isVip());

        assert.equal(gunther.messages.length, 0);
    });

    it('should not grant anyone VIP if the feature is disabled', async assert => {
        settings.setValue('decorations/holidays_free_vip', false);
        await gunther.identify({ vip: 0 });

        assert.isFalse(gunther.isVip());

        await server.clock.advance(10000 /* 10 seconds, twice the feature's wait */);
        assert.isFalse(gunther.isVip());

        assert.equal(gunther.messages.length, 0);
    });
});
