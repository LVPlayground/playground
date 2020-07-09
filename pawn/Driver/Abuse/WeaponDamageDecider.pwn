// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Decides on the amount of damage a shot should do when it has been overridden for that particular
// weapon. Right now this is an experiment, and has only been implemented for the Sawnoff Shotgun.
ProcessManualWeaponDamage(playerId, issuerId, weaponId, bodyPart) {
    if (!g_abuseManualSawnoffDamage)
        return;  // manual weapon damage has been disabled

    if (playerId == issuerId)
        return;  // the damage was self-inflicted

    if (PlayerSyncedData(playerId)->lagCompensationMode() == 0 /* disabled */
            || PlayerSyncedData(issuerId)->lagCompensationMode() == 0 /* disabled */) {
        return;  // either player has disabled lag compensation
    }

    // TODO: Implement this routine for more weapons if players like it.
    if (weaponId != /* Sawnoff Shotgun */ 26)
        return;

    new Float: position[3];

    GetPlayerPos(playerId, position[0], position[1], position[2]);

    // The distance between the |playerId| and the |issuerId|.
    new const Float: distance =
        GetPlayerDistanceFromPoint(issuerId, position[0], position[1], position[2]);

    switch (weaponId) {
        case 26:  // Sawnoff Shotgun
            ProcessManualSawnoffDamage(playerId, distance, bodyPart);
    }
}

// Processes manual damage for the |player|, who has been shot by the Sawnoff Shotgun from the given
// |distance|, on the given |bodyPart|. This mechanism was shared with us by PwN3R_B0T. Thank you!
ProcessManualSawnoffDamage(playerId, Float: distance, bodyPart) {
    new Float: baseDamage;

    switch (bodyPart) {
        case BODY_PART_TORSO, BODY_PART_CHEST:
            baseDamage = 20.0;
        case BODY_PART_LEFT_LEG, BODY_PART_RIGHT_LEG, BODY_PART_HEAD:
            baseDamage = 15.0;
        case BODY_PART_LEFT_ARM, BODY_PART_RIGHT_ARM:
            baseDamage = 10.0;
        default:
            baseDamage = 0.0;  // invalid shot
    }

    new Float: distanceMultiplier;

    if (distance < 1.0)
        distanceMultiplier = 0.0;
    else if (distance <= 3.0)
        distanceMultiplier = 2.0;
    else if (distance <= 6.0)
        distanceMultiplier = 1.3;
    else if (distance <= 10.0)
        distanceMultiplier = 0.7;
    else if (distance <= 15.0)
        distanceMultiplier = 0.5;
    else if (distance <= 20.0)
        distanceMultiplier = 0.35;
    else if (distance <= 25.0)
        distanceMultiplier = 0.2;
    else if (distance <= 35.0)  // maximum range
        distanceMultiplier = 0.04;
    else
        distanceMultiplier = 0.0;

    IssueDamageToPlayer(playerId, baseDamage * distanceMultiplier);
}

// Deals the given |amount| of damage to the given |player|. Will consider both their health and
// armour values, and kill them when the total becomes sufficiently low.
IssueDamageToPlayer(playerId, Float: amount) {
    new Float: armour;
    new Float: health;

    GetPlayerArmour(playerId, armour);
    GetPlayerHealth(playerId, health);

    new Float: remaining = amount;

    // (1) Substract as much damage as we can from the |playerId|'s armour.
    if (armour >= amount) {
        SetPlayerArmour(playerId, armour - amount);
        return;

    } else if (armour > 0) {
        SetPlayerArmour(playerId, 0);
        remaining -= armour;
    }

    // (2) Substract the |remaining| amount of damage from the |playerId|'s health. This may kill
    // them, in which case we'll forcefully set their health to zero.
    if (health > remaining)
        SetPlayerHealth(playerId, health - remaining);
    else
        SetPlayerHealth(playerId, 0.0);
}
