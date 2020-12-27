// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

#define KEY_SHIP_FIGHT 144

/**
 * Called when the state of any supported keys is changed, except for arrow keys.
 *
 * @param playerid Id of the player who pressed/released a key.
 * @param newkeys A map of the keys currently held.
 * @param oldkeys A map of the keys held prior to the current change.
 */
LegacyPlayerKeyStateChange(playerid, newkeys, oldkeys) {
    if (Player(playerid)->isNonPlayerCharacter() == true)
        return 0;

    Annotation::ExpandList<OnPlayerKeyStateChange>(playerid, newkeys, oldkeys);

    // Drinking
    CDrink__OnKey(playerid, newkeys);

    // Robbery
    CRobbery__OnKey(playerid, newkeys);

    // Ramping
    if (PRESSED(KEY_ACTION))
        OnPlayerPressRampKey(playerid);

    // Carbombs
    CBomb__DetonateCheck(playerid, newkeys);

    new playerState = GetPlayerState(playerid),
        playerWeapon = GetPlayerWeapon(playerid);

    if (playerState == PLAYER_STATE_ONFOOT && WEAPON_COLT45 <= playerWeapon <= WEAPON_CAMERA) {
        if (PRESSED(KEY_HANDBRAKE) && !g_isAiming[playerid] && GetPlayerCameraMode(playerid) == 7) {
            VeryImportantPlayersManager->suspendPlayerLook(playerid);
            g_isAiming[playerid] = true;
        } else if (RELEASED(KEY_HANDBRAKE) && g_isAiming[playerid]) {
            VeryImportantPlayersManager->applyPlayerLook(playerid);
            g_isAiming[playerid] = false;
        }
    }

    // Player presses FIRE (LMB, LCTRL)
    if (PRESSED(KEY_FIRE) || (PRESSED(KEY_FIRE) && PRESSED(KEY_SECONDARY_ATTACK))) {
        if (playerState == PLAYER_STATE_ONFOOT) {
            if (CHideGame__GetPlayerState(playerid) == HS_STATE_PLAYING) {
                CHideGame__onPlayerPunch(playerid);
                return 1;
            }

            // Anti-ship fighting
            if (ShipManager->isPlayerWalkingOnShip(playerid)) {
                if ((GetPlayerVirtualWorld(playerid) == 0)
                    && !IsPlayerInMinigame(playerid) && Player(playerid)->isAdministrator() == false
                    && ((GetPlayerSpecialAction(playerid) == SPECIAL_ACTION_NONE) || (GetPlayerSpecialAction(playerid) == SPECIAL_ACTION_DUCK)))
                    ClearAnimations(playerid, 1);
            }

            if (GetPlayerWeapon(playerid) >= 16) {
                DamageManager(playerid)->setFighting(Time->currentTime());

                if (playerTaxi[playerid][0] > -1 && playerTaxi[playerid][1] < 5) {
                    CancelTaxi(playerid);
                    SendClientMessage(playerid, Color::Error, "You scared off the taxi driver because you're shooting!");
                }
            }
        }
    }

    // Other fighting style (punch + kick combo)
    if (PRESSED(KEY_SHIP_FIGHT) && ShipManager->isPlayerWalkingOnShip(playerid)) {
        if ((GetPlayerVirtualWorld(playerid) == 0)
            && !IsPlayerInMinigame(playerid) && Player(playerid)->isAdministrator() == false
            && GetPlayerSpecialAction(playerid) == 0) {
            ClearAnimations(playerid, 1);
        }

        if (CHideGame__GetPlayerState(playerid) == HS_STATE_PLAYING) {
            CHideGame__onPlayerPunch(playerid);
            return 1;
        }
    }

    return 1;
}