// Copyright 2017 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Trait that, when enabled, hands out VIP to players who haven't donated already. A simple message
// will be shown telling them that it'll go away in January.
class FreeVip {
    constructor() {
        server.playerManager.addObserver(this, false /* replayHistory */);
    }

    // Called when a player logs in to their account. Will grant them VIP after a small delay if
    // they haven't donated to Las Venturas Playground in the past.
    async onPlayerLogin(player) {
        if (player.isVip())
            return;  // the player already has VIP rights

        await wait(5000);
        if (!player.isConnected())
            return;  // the player disconnected while awaiting the delay

        player.sendMessage('Surprise! You\'ve been granted you VIP rights to celebrate the festive');
        player.sendMessage('season. It won\'t last for long, so please enjoy your new abilities!');
        player.sendMessage('Consider donating on https://sa-mp.nl/donate if you like it!');

        player.setVip(true);

        // Make sure that the Pawn code is aware of their VIP rights as well.
        pawnInvoke('OnGrantVipToPlayer', 'i', player.id);
    }

    dispose() {
        server.playerManager.removeObserver(this);
    }
};

export default FreeVip;
