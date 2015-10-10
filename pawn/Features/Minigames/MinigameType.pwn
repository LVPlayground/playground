// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * We support various major kinds of minigames, each one having their own controller and runtime.
 * At the same time, a large number of functionalities are shared between the minigames, so there
 * are common entry points for pretty much everything one wants to do.
 *
 * NOTE: Update /Resources/Minigames/Core/main.pwn when adding a new minigame type.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
enum MinigameType {
    // Races spawn the player in a vehicle and require them to drive on a track in the shortest
    // time possible. High scores will be stored, prizes can be won.
    RaceMinigame,

    // Jumps are hand-created stunt zones with loads of vehicles and weird objects. Perfect for
    // hanging around and having some fun.
    JumpMinigame,

    // Deathmatch minigames spawn a number of players at a certain location in the world for the
    // simple purpose of them killing the heck out of each other. Free for all.
    DeathmatchMinigame,

    // The waterfight minigame spawns players on top of glass squares, which can be destroyed upon
    // bullet damage and causes players to fall through these squares. Last man wins.
    WaterFightMinigame,

    // Haystack is a fun and small minigame where players need to reach the top of a pile of
    // moving blocks of hay.
    HayStackMinigame,

    // Players get to spawn near a bunch of cars, all with the same goal: reach the briefcase and
    // bring it back before anybody else does.
    CaptureBriefcaseMinigame,

    // During this minigame a team of attackers try to rob a casino while getting gunned by the
    // defending team.
    CasinoRobberyMinigame,

    // A classic minigame where two teams battle for each other's boats.
    RivershellMinigame,

    // Two teams fight with a certain set of weapons in this team deathmatch minigame. This set of
    // weapons is based on 'running while shooting', and thus consists of sawn-off shotguns, UZIs etc.
    RunWeaponsTeamWarMinigame,

    // Two teams fight with a certain set of weapons in this team deathmatch minigame. This set of
    // weapons is based on 'walking while shooting', and thus consists of snipers, M4s etc.
    WalkiesWeaponsTeamWarMinigame,

    // A classic minigame where two teams battle for each other's vehicles.
    LocalYocalSportsEditionMinigame,

    // Derbies are small minigames where players have to destroy/bump off/explode other player's
    // their vehicles in order to win.
    DerbyMinigame,

    // If we cannot determine what kind of minigame the player is using, return Unknown.
    UnknownMinigame
};

/**
 * Converts an entry from the MinigameType enumeration to a string representation which can be used
 * in messages emitted by the gamemode.
 *
 * @param type An entry of the MinigameType enumeration to convert.
 * @param buffer The string buffer in which the resulting string should be stored.
 * @param bufferSize Size of the buffer in which we can store the buffer.
 */
MinigameTypeToString(MinigameType: type, buffer[], bufferSize = sizeof(buffer)) {
    switch (type) {
        case RaceMinigame:
            strncpy(buffer, "race", bufferSize);
        case JumpMinigame:
            strncpy(buffer, "jump", bufferSize);
        case DeathmatchMinigame:
            strncpy(buffer, "fight", bufferSize);
        case DerbyMinigame:
            strncpy(buffer, "derby", bufferSize);
        default:
            strncpy(buffer, "minigame", bufferSize);
    }
}
