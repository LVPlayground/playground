// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Allow players up to give minutes to reconnect to the server.
export const kAutoRestartReconnectionGraceSec = 300;

// Time at which the server started. Does not account for time taken to run tests. This function
// call yields the same result as server.clock.monotonicallyIncreasingTime().
const kServerStartTime = highResolutionTime();

// Implements lasting behaviour supported by the Playground feature, such as the ability to enable
// free VIP for all players during selective festive seasons.
export class PlaygroundManager {
    #announce_ = null;
    #settings_ = null;

    #restartToken_ = null;

    constructor(announce, settings) {
        this.#announce_ = announce;
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

    // Called when the |player| has disconnected from the server. If auto-restarts are enabled and
    // there are no more players in-game, we might kill the server after a little while.
    onPlayerDisconnect(player) {
        if (!this.#settings_().getValue('server/auto_restart_enabled'))
            return;  // automatic restarts are disabled

        const uptimeMilliseconds = server.clock.monotonicallyIncreasingTime() - kServerStartTime;
        const uptimeHours = uptimeMilliseconds / /* to seconds */ 1000 / /* to hours */ 3600;

        if (uptimeHours < this.#settings_().getValue('server/auto_restart_interval_hours'))
            return;  // the server hasn't been online long enough yet

        for (const otherPlayer of server.playerManager) {
            if (otherPlayer.isNonPlayerCharacter())
                continue;  // ignore NPCs

            if (otherPlayer === player)
                continue;  // the |player| is disconnecting

            // If we hit this place, then there's at least one more player online on the server. The
            // auto-restart mechanism will thus be disabled.
            return;
        }

        // If we hit this place, however, then there are no further players in-game. Wait for a
        // period of time to allow players to re-connect if they intend to do this.
        const restartToken = Symbol('Restarting the server?');
        this.#restartToken_ = restartToken;

        wait(kAutoRestartReconnectionGraceSec * 1000).then(() => {
            if (this.#restartToken_ !== restartToken)
                return;  // our restart token has been revoked since

            for (const otherPlayer of server.playerManager) {
                if (otherPlayer.isNonPlayerCharacter())
                    continue;  // ignore NPCs

                // Someone's in-game. Drop out, we don't want to kill the server anymore.
                this.#restartToken_ = null;

                return;
            }

            // We actually do want to kill the server now. Excellent. Let's do it.
            this.#announce_().announceToAdministrators(Message.LVP_SERVER_AUTO_RESTART);
            wait(1500).then(() => killServer());
        });
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.playerManager.removeObserver(this);

        this.#restartToken_ = null;

        this.#announce_ = null;
        this.#settings_ = null;
    }
}
