// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * This callback is initiated whenever a player's client records damage taken.
 *
 * @param playerid Id of the player that took damage.
 * @param issuerid Id of the player that caused the damage, or INVALID_PLAYER_ID if self-inflicted.
 * @param amount The amount of damage playerid took, armour and health combined.
 * @param weaponid Id of the weapon/reason for the damage.
 */
public OnPlayerTakeDamage(playerid, issuerid, Float: amount, weaponid, bodypart) {
    if (!ShipManager->isPlayerWalkingOnShip(playerid) && issuerid != INVALID_PLAYER_ID)
        LastShot[playerid] = Time->currentTime();

    return 1;
}