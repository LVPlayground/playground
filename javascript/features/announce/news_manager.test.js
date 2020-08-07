// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('NewsManager', (it, beforeEach) => {
    let gunther = null;
    let manager = null;

    beforeEach(() => {
        const feature = server.featureManager.loadFeature('announce');

        gunther = server.playerManager.getById(/* Gunther= */ 0);
        manager = feature.newsManager_;
    });

    it('should be able to sanitize news messages', assert => {
        // Test the individual requirements
        assert.equal(manager.sanitizeMessage('hello '), 'hello');
        assert.equal(manager.sanitizeMessage('h~ello~'), 'hello');
        assert.equal(manager.sanitizeMessage('h~e~llo'), 'hello');
        assert.equal(manager.sanitizeMessage('h~b~ello'), 'h~b~ello');

        assert.equal(manager.sanitizeMessage('[~k~~GO_LEFT~]'), '[~k~~GO_LEFT~]');
        assert.equal(manager.sanitizeMessage('[~k~~SHORT~]'), '[kSHORT]');
        assert.equal(
            manager.sanitizeMessage('[~k~~VEHICLE_FIREWEAPON_ALT~]'),
            '[~k~~VEHICLE_FIREWEAPON_ALT~]');
        assert.equal(
            manager.sanitizeMessage('[~k~~SOME_SUPER_LONG_KEY_NAME~]'),
            '[kSOME_SUPER_LONG_KEY_NAME]');
    });
});
