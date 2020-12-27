// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Banner, kDefaultDisplayTimeMs } from 'components/interface/banner.js';

describe('Banner', it => {
    it('should be able to display and expire banners', async (assert) => {
        const gunther = server.playerManager.getById(/* Gunther= */ 0);
        const originalTextDrawCount = server.textDrawManager.size;

        const promise = Banner.displayForPlayer(gunther, {
            title: 'Hello, world!',
            message: 'This is a banner.',
        });

        assert.equal(server.textDrawManager.size, originalTextDrawCount + 3);

        await server.clock.advance(kDefaultDisplayTimeMs);
        await promise;

        assert.equal(server.textDrawManager.size, originalTextDrawCount);
    });
});
