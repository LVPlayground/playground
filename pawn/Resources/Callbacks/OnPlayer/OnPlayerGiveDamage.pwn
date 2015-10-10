// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * This callback is initiated whenever a player's client records damage dealt.
 *
 * @param playerid Id of the player that gave damage.
 * @param damagedid Id of the player that received the damage.
 * @param amount The amount of damage damagedid lost, armour and health combined.
 * @param weaponid Id of the weapon/reason for the damage.
 */
public OnPlayerGiveDamage(playerid, damagedid, Float: amount, weaponid, bodypart) {
    LastShot[playerid] = Time->currentTime();

    if (Player(damagedid)->isMinimized() == true)
        return 0;

    if (g_bPlayerGodmode[damagedid])
        return 0;

    if (weaponid != WEAPON_SNIPER)
        return 0;

    if (GetPlayerCameraMode(playerid) != 7)
        return 0;

    if (GetPlayerInterior(playerid) != 0 || iPlayerInVipRoom[playerid])
        return 0;

    new Float: takerX,
        Float: takerY,
        Float: takerZ,
        Float: dealerX,
        Float: dealerY,
        Float: dealerZ,
        Float: distance,
        Float: cameraVectorX,
        Float: cameraVectorY,
        Float: cameraVectorZ,
        Float: cameraX,
        Float: cameraY,
        Float: cameraZ;

    // Gather variables regarding the damage dealer, in particular the vector of the player's aim.
    GetPlayerCameraPos(playerid, cameraX, cameraY, cameraZ);
    GetPlayerCameraFrontVector(playerid, cameraVectorX, cameraVectorY, cameraVectorZ);
    GetPlayerPos(playerid, dealerX, dealerY, dealerZ);

    // Gather variables regarding the damage taker, in particular the position of the player's head.
    GetPlayerPos(damagedid, takerX, takerY, takerZ);
    takerZ += 0.675; /* make sure we measure from the player's head */

    // Calculate the distance between the damage taker's head, and the damage dealer's line of aim.
    GetDistanceFromPointToLine(distance, cameraVectorX, cameraVectorY, cameraVectorZ, cameraX, cameraY,
        cameraZ, takerX, takerY, takerZ);

    // If the distance is accurate enough, we deal a noteworthy damage of 100.
    if (distance < 0.25) {
        new Float: health,
            Float: armour;

        GetPlayerHealth(damagedid, health);
        GetPlayerArmour(damagedid, armour);

        if (ShipManager->isPlayerWalkingOnShip(damagedid) && GetPlayerVirtualWorld(damagedid) == 0)
            return 1;

        if (health > 100 || armour > 100)
            return 1;

        // Time to deal the actual damage. First up is armour, anything else will be taken away from health.
        new dealDamage = 100;
        if (armour > 0) {
            SetPlayerArmour(damagedid, 0);
            dealDamage -= floatround(armour);
        }

        if (dealDamage > 0) {
            if (floatround(health) - dealDamage <= 0) { /* if we kill our player, set the correct killerId and reasonId */
                validKillerId[damagedid] = playerid;
                validReasonId[damagedid] = WEAPON_SNIPER;
            }

            SetPlayerHealth(damagedid, health - dealDamage);
        }

        // Show a text and play a sound for the damage taker and dealer.
        GameTextForPlayer(damagedid, "~r~Headshot!", 5000, 5);
        PlayAudioStreamForPlayer(playerid, "http://crew.sa-mp.nl/jay/radio/headshot.mp3");
    }

    return 1;
    #pragma unused amount
}

stock crossp(Float: v1x, Float: v1y, Float: v1z, Float: v2x, Float: v2y, Float: v2z, &Float: output) {
    new Float: c1 = (v1y * v2z) - (v1z * v2y),
        Float: c2 = (v1z * v2x) - (v1x * v2z),
        Float: c3 = (v1x * v2y) - (v1y * v2x);

    output = floatsqroot((c1 * c1) + (c2 * c2) + (c3 * c3));
}

stock GetDistanceFromPointToLine(&Float: distance, Float: line_vector_x, Float: line_vector_y, Float: line_vector_z, Float: line_x, Float: line_y, Float: line_z, Float: point_x, Float: point_y, Float: point_z) {
    new Float: output;

    crossp(line_vector_x, line_vector_y, line_vector_z, point_x - line_x, point_y - line_y, point_z - line_z, output);
    distance = output / floatsqroot((line_vector_x * line_vector_x) + (line_vector_y * line_vector_y) + (line_vector_z * line_vector_z));
}