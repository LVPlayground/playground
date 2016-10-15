/**
 * Copyright (c) 2006-2015 Las Venturas Playground
 *
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation; either version 2 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program; if
 * not, write to the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA
 * 02110-1301, USA.
 */

/**
 * The purpose of a DM server is to eventually rack up kills rather than deaths. That set aside,
 * damage done to players should be regulated in order to avoid buggy or abusive behaviour, but also
 * to provide unique features.
 * For example: headshots deal 100 damage, or: paused players should not take any damage.
 *
 * Several SA:MP callbacks will be scripted in this class to achive the above.
 *
 * @author Max "Cake" Blokker <cake@sa-mp.nl>
 */
class DamageManager <playerId (MAX_PLAYERS)> {
    // After approximately 10 seconds of peace, a fight is over.
    const FightingStateDuration = 10;

    // The amount of damage a sniper headshot does, is different from default.
    const SniperHeadShotDamage = 100;

    // Is the player currently fighting? Fighting is defined as shooting or being shot at.
    new m_fighting;

    // Track the last playerId who hit a player.
    new m_lastHitId;

    // Keep track of the time a player has been hit last.
    new m_lastHitTime;

    /**
     * Special damage is done when a sniper headshot has been made. This function deals the proper
     * damage to the subject's armour and health. This function will be disabled if both players
     * are part of the same team, and that team is not NO_TEAM.
     */
    public dealHeadShot(subjectId) {
        if (GetPlayerTeam(subjectId) != NO_TEAM && GetPlayerTeam(subjectId) == GetPlayerTeam(playerId))
            return;  // the players are part of the same team

        // Retrieve the subject's current health statistics.
        new Float: subjectHealth, Float: subjectArmour;
        GetPlayerHealth(subjectId, subjectHealth);
        GetPlayerArmour(subjectId, subjectArmour);

        // Time to deal the actual damage. First up is armour.
        new dealDamage = SniperHeadShotDamage;
        if (subjectArmour > 0) {
            SetPlayerArmour(subjectId, 0);
            dealDamage -= floatround(subjectArmour);
        }

        // Any damage left will be taken away from health.
        if (dealDamage > 0) {
            if (floatround(subjectHealth) - dealDamage <= 0) /* if we kill a player, set the correct killerId and reasonId */
                LegacySetValidKillerVariables(subjectId, playerId, WEAPON_SNIPER);

            SetPlayerHealth(subjectId, subjectHealth - dealDamage);
        }

        // Show a text and play a sound for the damage taker and dealer.
        GameTextForPlayer(subjectId, "~r~Ouch, headshot!", 2000, 6);
        PlayAudioStreamForPlayer(playerId, "https://crew.sa-mp.nl/jay/radio/headshot.mp3");
    }

    /**
     * Set the current time for a fighting player. If enough passive-time has passed, the player
     * won't be marked as fighting anymore.
     */
    public inline setFighting(currentTime) {
        m_fighting = currentTime;
    }

    /**
     * Set the last playerId who hit a player.
     */
    public inline setLastHitId(subjectId) {
        m_lastHitId = subjectId;
    }

    /**
     * Set the time a player has been hit last.
     */
    public inline setLastHitTime(currentTime) {
        m_lastHitTime = currentTime;
    }

    /**
     * Returns whether this player has been active in a fight in the last 10 seconds.
     *
     * @return boolean Is this player in a fighting state?
     */
    public bool: isPlayerFighting() {
        if (!Player(playerId)->isConnected() || Player(playerId)->isAdministrator())
            return false;

        if (Time->currentTime() - m_fighting < FightingStateDuration)
            return true;

        return false;
    }

    /**
     * Returns whether this player is currently falling, and thus should have limited command
     * functionality. We don't count players in vehicles.
     *
     * @return boolean Is this player falling?
     */
    public bool: isPlayerFalling() {
        if (!Player(playerId)->isConnected() || Player(playerId)->isNonPlayerCharacter()
            || Player(playerId)->isAdministrator() || IsPlayerInAnyVehicle(playerId))
            return false;

        new animationIndex = GetPlayerAnimationIndex(playerId);
        if (animationIndex >= 958 && animationIndex <= 979 /* parachute */ || animationIndex == 1130 /* fall */
            || animationIndex == 1132 /* fall glide */ || animationIndex == 1195 /* jump glide */)
            return true;

        return false;
    }

    /**
     * Get the last playerId who hit a player.
     */
    public inline getLastHitId() {
        m_lastHitId;
    }

    /**
     * Get the time a player has been hit last.
     */
    public inline getLastHitTime() {
        m_lastHitTime;
    }

    /**
     * Reset some variables upon player joining.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect() {
        m_fighting = 0;
        m_lastHitId = Player::InvalidId;
        m_lastHitTime = 0;
    }
};

/**
 * This callback is called when a player fires a shot from a weapon. Only bullet weapons are supported.
 * Only passenger drive-by is supported (not driver drive-by, and not sea-sparrow/hunter shots).
 *
 * @param playerid Id of the player that shot a weapon.
 * @param weaponid Id of the weapon shot by the player.
 * @param hittype The type of the thing that was shot (none, player, vehicle, object, player object).
 * @param hitid Id of the player, vehicle or object that was hit.
 * @param fX The X coordinate that the shot hit.
 * @param fY The Y coordinate that the shot hit.
 * @param fZ The Z coordinate that the shot hit.
 */
public OnPlayerWeaponShot(playerid, weaponid, hittype, hitid, Float: fX, Float: fY, Float: fZ) {
    if (!Player(playerid)->isConnected())
        return 0;

    // Set the player who fired the bullets as currently fighting.
    DamageManager(playerid)->setFighting(Time->currentTime());

    // Some exceptions take place when it is a player being shot at.
    if (hittype == BULLET_HIT_TYPE_PLAYER) {
        // Checking for out of bound possibilities.
        if (!Player(hitid)->isConnected() || Player(hitid)->isNonPlayerCharacter())
            return 0;

        // A paused player should not be able to take damage.
        if (Player(hitid)->isMinimized())
            return 0;

        // Crew members using god-mode should not be able to take damage.
        if (LegacyPlayerHasGodMode(hitid))
            return 0;

        // Players inside interiors (including VIP room), should not be hurt, various minigames are
        // exceptions to this rule.
        if (GetPlayerInterior(hitid) != 0 || LegacyIsPlayerInVipRoom(hitid)) {
            new bool: inFight = CRobbery__IsPlaying(playerid);

#if Feature::DisableFights == 0
            inFight |= CFightClub__IsPlayerFighting(playerid) ||
                       CWWT__IsPlaying(playerid);
#endif

            if (!inFight)
                return 0;
        }
    }

    return 1;
}

/**
 * This callback is initiated whenever a player's client records damage dealt.
 *
 * @param playerid Id of the player that gave damage.
 * @param damagedid Id of the player that received the damage.
 * @param amount The amount of damage playerid inflicted, armour and health combined.
 * @param weaponid Id of the weapon/reason for the damage.
 * @param bodypart Id of the body part that was hit.
 */
public OnPlayerGiveDamage(playerid, damagedid, Float: amount, weaponid, bodypart) {
    // Set the player who issued the damage as currently fighting.
    DamageManager(playerid)->setFighting(Time->currentTime());

    return 1;
    #pragma unused damagedid, amount, weaponid, bodypart
}

/**
 * This callback is initiated whenever a player's client records damage taken.
 *
 * @param playerid Id of the player that took damage.
 * @param issuerid Id of the player that caused the damage, or INVALID_PLAYER_ID if self-inflicted.
 * @param amount The amount of damage playerid took, armour and health combined.
 * @param weaponid Id of the weapon/reason for the damage.
 * @param bodypart Id of the body part that was hit.
 */
public OnPlayerTakeDamage(playerid, issuerid, Float: amount, weaponid, bodypart) {
    if (!Player(playerid)->isConnected() || Player(playerid)->isNonPlayerCharacter())
        return 0;

    if (issuerid != Player::InvalidId) {
        // Keep track of the last person who hit a player.
        DamageManager(playerid)->setLastHitId(issuerid);
        DamageManager(playerid)->setLastHitTime(Time->currentTime());

        // If the player is currently not residing on the ship, or if the damage is not self-inflicted,
        // set the player as currently fighting.
        if (!ShipManager->isPlayerWalkingOnShip(playerid))
            DamageManager(playerid)->setFighting(Time->currentTime());

        // Deal noteworthy more damage for sniper headshots.
        if (!ShipManager->isPlayerWalkingOnShip(playerid) && weaponid == WEAPON_SNIPER && bodypart == BODY_PART_HEAD)
            DamageManager(issuerid)->dealHeadShot(playerid);

        // Play the hitsound if the player enabled it.
        if (PlayerSettings(issuerid)->isPlayerHitSoundEnabled())
            PlayerPlaySound(issuerid, 17802, 0, 0, 0);
    }

    return 1;
    #pragma unused playerid, amount, weaponid, bodypart
}