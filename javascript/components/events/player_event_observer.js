// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Observer for player-related events straight from the DeferredEventManager. Any of the methods can
// be overridden by the implementation of this class.
export class PlayerEventObserver {
    // Called when a player has died, potentially by another player. |killer| may be NULL.
    onPlayerDeath(player, killer, reason) {}

    // Called when the |target| has just streamed in for the given |player|.
    onPlayerStreamIn(player, target) {}

    // Called when a player has reported taking damage by the |issuer|. Both are guaranteed to be
    // valid Player instances. The other information is meta-data.
    onPlayerTakeDamage(player, issuer, amount, weaponId, bodyPart) {}

    // Called when a player has shot their weapon, and potentially hit something. The parameters are
    // documented here: https://wiki.sa-mp.com/wiki/OnPlayerWeaponShot
    onPlayerWeaponShot(player, weaponId, hitType, hitId, hitPosition) {}
}
