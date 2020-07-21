// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Color } from 'base/color.js';

import { kDefaultAlpha } from 'features/player_colors/default_colors.js';

describe('PlayerColors', (it, beforeEach) => {
    let feature = null;
    let gunther = null;

    beforeEach(() => {
        feature = server.featureManager.loadFeature('player_colors');
        gunther = server.playerManager.getById(/* Gunther= */ 0);
    });

    it('should be able to support an hierarchy of colours', assert => {
        assert.isTrue(Player.prototype.hasOwnProperty('colors'));

        // (1) Everyone gets a base color based on their player ID.
        assert.instanceOf(gunther.colors.baseColor, Color);
        assert.isNull(gunther.colors.levelColor);
        assert.isNull(gunther.colors.customColor);
        assert.isNull(gunther.colors.gangColor);
        assert.isNull(gunther.colors.gameColor);

        assert.strictEqual(gunther.colors.currentColor, gunther.colors.baseColor);

        // (2) Administrators get their Level color set.
        server.playerManager.onPlayerLevelChange({
            playerid: gunther.id,
            newlevel: 2 /* Pawn representation of administrators */
        });

        assert.instanceOf(gunther.colors.baseColor, Color);
        assert.instanceOf(gunther.colors.levelColor, Color);
        assert.isNull(gunther.colors.customColor);
        assert.isNull(gunther.colors.gangColor);
        assert.isNull(gunther.colors.gameColor);

        assert.strictEqual(gunther.colors.currentColor, gunther.colors.levelColor);

        // (3) Picking a custom color will make that the preferred display mode.
        gunther.colors.customColor = Color.fromRGBA(141, 110, 99, 170);

        assert.instanceOf(gunther.colors.baseColor, Color);
        assert.instanceOf(gunther.colors.levelColor, Color);
        assert.instanceOf(gunther.colors.customColor, Color);
        assert.isNull(gunther.colors.gangColor);
        assert.isNull(gunther.colors.gameColor);

        assert.strictEqual(gunther.colors.currentColor, gunther.colors.customColor);

        // (4) Assigning a gang color will make that take precedence.
        gunther.colors.gangColor = Color.fromRGBA(255, 152, 0, 170);

        assert.instanceOf(gunther.colors.baseColor, Color);
        assert.instanceOf(gunther.colors.levelColor, Color);
        assert.instanceOf(gunther.colors.customColor, Color);
        assert.instanceOf(gunther.colors.gangColor, Color);
        assert.isNull(gunther.colors.gameColor);

        assert.strictEqual(gunther.colors.currentColor, gunther.colors.gangColor);

        // (5) And, finally, assigning a game color makes that take the lead.
        gunther.colors.gameColor = Color.fromRGBA(118, 255, 3, 170);

        assert.instanceOf(gunther.colors.baseColor, Color);
        assert.instanceOf(gunther.colors.levelColor, Color);
        assert.instanceOf(gunther.colors.customColor, Color);
        assert.instanceOf(gunther.colors.gangColor, Color);
        assert.instanceOf(gunther.colors.gameColor, Color);

        assert.strictEqual(gunther.colors.currentColor, gunther.colors.gameColor);

        // Take the colors away and ensure that we fall back to the previous color.
        gunther.colors.gangColor = null;
        gunther.colors.gameColor = null;

        assert.strictEqual(gunther.colors.currentColor, gunther.colors.customColor);

        gunther.level = Player.LEVEL_PLAYER;
        gunther.colors.customColor = null;

        assert.strictEqual(gunther.colors.currentColor, gunther.colors.baseColor);
    });

    it('should support both global and invididual invisibility', async (assert) => {
        const russell = server.playerManager.getById(/* Russell= */ 1);
        const lucy = server.playerManager.getById(/* Lucy= */ 2);

        // (1) Support for global, server-wide invisibility for a player.
        assert.equal(gunther.color.a, kDefaultAlpha);

        gunther.colors.visible = false;
        assert.equal(gunther.color.a, 0);

        gunther.colors.visible = true;
        assert.equal(gunther.color.a, kDefaultAlpha);

        // (2) Support for individual, per-player-for-player overrides of visibility.
    });
});
