// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * There are several reasons which can lead to a player leaving their minigame. This enumeration
 * contains a key for each of them, allowing us to properly give consistent replies to the player.
 */
enum MinigameDropoutReason {
    // When a player leaves a minigame because they typed the /leave command.
    LeaveCommandDropoutReason,

    // When not enough players have signed up to participate in a minigame.
    NotEnoughPlayersDropoutReason,

    // Administrators have the ability to force players out of minigames.
    RemovedByAdministratorDropoutReason
};

/**
 * Reason why a player has left the server, to avoid having "2" (kicked) as a catch-all.
 */
enum PlayerKickReason {
    UnknownKickReason,

    KickedKickReason,
    BannedKickReason,
    AutoBannedKickReason,
    ForceReconnectKickReason
};