// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Manages mutes on the server. These are centrally controlled, and will affect any and all
// communication on the server.
export class MuteManager {
    communicationMuted_ = false;

    // Returns whether full server communication is currently muted. This means that only in-game
    // administrators are able to talk with players.
    isCommunicationMuted() {
        return this.communicationMuted_;
    }

    // Toggles whether server communications are muted altogether.
    setCommunicationMuted(player, muted) {
        this.communicationMuted_ = !!muted;
    }

    // Returns the number of seconds the |player| still will be muted for. Will return a falsy value
    // if the |player| is not currently muted.
    getPlayerRemainingMuteTime(player) {
        if (!player.account.mutedUntil)
            return null;  // they haven't been muted this session
        
        const currentTime = server.clock.monotonicallyIncreasingTime();
        if (player.account.mutedUntil < currentTime)
            return null;  // mute has expired

        return Math.ceil((player.account.mutedUntil - currentTime) / 1000);
    }

    // Mutes the |player| for the given time in |seconds|. This will persist between playing
    // sessions, so them reconnecting to the server will not make a difference.
    mutePlayer(player, seconds) {
        player.account.mutedUntil = server.clock.monotonicallyIncreasingTime() + 1000 * seconds;
    }

    // Removes any mutes that the |player| is currently subject to.
    unmutePlayer(player) {
        player.account.mutedUntil = 0;
    }
}
