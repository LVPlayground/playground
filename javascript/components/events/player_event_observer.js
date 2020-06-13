// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Observer for player-related events straight from the DeferredEventManager. Any of the methods can
// be overridden by the implementation of this class.
export class PlayerEventObserver {
    // Called when a player has died, potentially by another player. The event is structured as:
    // { playerid: number, killerid: number, reason: number }
    onPlayerDeath(event) {}
}
