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

    // Toggles whether server communications are muted altogether. Will cause a public announcement
    // about |player| changing the server's communication abilities.
    setCommunicationMuted(player, muted) {
        if (this.communicationMuted_ === !!muted)
            return;  // no change

        for (const otherPlayer of server.playerManager) {
            if (!!muted)
                otherPlayer.sendMessage(Message.COMMUNICATION_SERVER_MUTED, player.name);
            else
                otherPlayer.sendMessage(Message.COMMUNICATION_SERVER_UNMUTED, player.name);
        }

        this.communicationMuted_ = !!muted;
    }

    // Returns whether the |player| is currently muted.
    isPlayerMuted(player) {

    }

    // Mutes the |player| for the given time in |seconds|. This will persist between playing
    // sessions, so them reconnecting to the server will not make a difference.
    mutePlayer(player, seconds) {

    }

    // Removes any mutes that the |player| is currently subject to.
    unmutePlayer(player) {

    }
}
