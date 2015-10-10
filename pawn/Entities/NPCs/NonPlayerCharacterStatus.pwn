// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * Non-player characters can have various statuses, all of which identify a moment in their lifetime
 * which depends on the feature itself. The following ones are available.
 */
enum NonPlayerCharacterStatus {
    // Indicates that the non-player character slot is available.
    AvailableNpcStatus,

    // Indicates that the non-player character slot has been allocated, but the bot itself is still
    // in progress of being connected to the server.
    ConnectingNpcStatus,

    // Indicates that the non-player character slot is being used by an NPC which has already
    // connected to the server, and is available for use.
    ConnectedNpcStatus,

    // Indicates that a disconnect has been requested for this non-player character, which has not
    // yet happened. The bot cannot be relied upon anymore.
    DisconnectingNpcStatus
};
