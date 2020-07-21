// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Color } from 'base/color.js';

// Provides native functions to Pawn with the intention of making colour management available to
// functionality still living there. All of these are declared in natives.txt as well.
export class ColorNatives {
    constructor() {
        provideNative(
            'SetPlayerGameColor', 'ii', ColorNatives.prototype.setPlayerGameColor.bind(this));
        provideNative(
            'ReleasePlayerGameColor', 'ii',
            ColorNatives.prototype.releasePlayerGameColor.bind(this));
    }

    // native SetPlayerGameColor(playerid, color);
    setPlayerGameColor(playerid, color) {
        const player = server.playerManager.getById(playerid);
        if (!player)
            return 0;  // invalid |playerid| passed

        player.colors.gameColor = Color.fromNumberRGBA(color);
    }

    // native ReleasePlayerGameColor(playerid);
    releasePlayerGameColor(playerid) {
        const player = server.playerManager.getById(playerid);
        if (!player)
            return 0;  // invalid |playerid| passed

        player.colors.gameColor = null;
    }

    dispose() {
        provideNative('SetPlayerGameColor', 'ii', () => 1);
        provideNative('ReleasePlayerGameColor', 'i', () => 1);
    }
}
