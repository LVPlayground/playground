// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Implements lasting behaviour supported by the Playground feature, such as the ability to enable
// free VIP for all players during selective festive seasons.
export class PlaygroundManager {
    #settings_ = null;

    constructor(settings) {
        this.#settings_ = settings;

        server.playerManager.addObserver(this);
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the given |player| has logged in to Las Venturas Playground. If the free VIP
    // setting is enabled, and they aren't a VIP already, they will be granted VIPness.
    onPlayerLogin(player) {
        if (!this.#settings_().getValue('playground/enable_free_vip'))
            return;  // the free VIP feature has not been enabled

        if (player.isVip())
            return;  // the player already has VIP rights

        // Wait for some amount of time after they've connected to share the good news with them.
        wait(5000).then(() => {
            if (!player.isConnected())
                return;  // the player disconnected while awaiting the delay

            player.sendMessage(
                `Surprise! You've been granted you VIP rights to celebrate the festive`);
            player.sendMessage(
                `season. It won\'t last for long, so please enjoy your new abilities!`);
            player.sendMessage(
                `Consider donating on https://sa-mp.nl/donate if you like it!`);

            player.setVip(true);

            // Make sure that the Pawn code is aware of their VIP rights as well.
            pawnInvoke('OnGrantVipToPlayer', 'i', player.id);
        });
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.playerManager.removeObserver(this);

        this.#settings_ = null;
    }
}
