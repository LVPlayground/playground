// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('AreaManager', (it, beforeEach) => {
    let manager = null;

    beforeEach(() => manager = server.areaManager);

    // FYI: Thorough entitity reflection tests are included with the ScopedEntities suite.

    it('is able to attach and remove observers to/from areas', assert => {
        const circle = manager.createCircularArea(new Vector(10, 10), 15);
        const sphere = manager.createSphericalArea(new Vector(50, 50, 10), 10);

        let enteredCalls = 0;
        let leftCalls = 0;

        const observer = new class {
            onPlayerEnterArea(player, area) {
                ++enteredCalls;
            }
            onPlayerLeaveArea(player, area) {
                ++leftCalls;
            }
        };

        circle.addObserver(observer);
        sphere.addObserver(observer);

        assert.equal(enteredCalls, 0);
        assert.equal(leftCalls, 0);

        const gunther = server.playerManager.getById(/* Gunther= */ 0);

        manager.onPlayerEnterArea({ playerid: gunther.id, areaid: circle.id });

        assert.equal(enteredCalls, 1);
        assert.equal(leftCalls, 0);

        manager.onPlayerLeaveArea({ playerid: gunther.id, areaid: sphere.id });

        assert.equal(enteredCalls, 1);
        assert.equal(leftCalls, 1);

        circle.removeObserver(observer);

        manager.onPlayerLeaveArea({ playerid: gunther.id, areaid: circle.id });

        assert.equal(enteredCalls, 1);
        assert.equal(leftCalls, 1);
    });
});
