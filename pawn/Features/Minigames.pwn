// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * The minigame system has a number of shared classes which work for every kind of minigame on
 * Las Venturas Playground. The state of a player in regards to a minigame offers a convenient way
 * of finding out whether a player is currently engaged in a minigame.
 */
#include "Features/Minigames/MinigameState.pwn"
#include "Features/Minigames/MinigameType.pwn"
#include "Features/Minigames/PlayerMinigameState.pwn"

/**
 * Deathmatch minigames have a lot in common, and the primary difference between most of the games
 * are their location, world environment and of course the used weapon. The new deathmatch handler
 * attempts to unify them into a much simpler structure.
 */
#if Feature::EnableDeathmatchMinigames == 1
#include "Features/Minigames/Deathmatch/DeathmatchController.pwn"
#endif

/**
 * Races are a more complicated system in Las Venturas Playground. We support an arbitrary number
 * of races, each of which will be stored in the database. Races have a completely revamped UI,
 * a number of animations while the race is loading, scoreboards and various other interactions.
 */
#include "Features/Minigames/Races/RaceSettings.pwn"

#include "Features/Minigames/Races/RaceDifficulty.pwn"
#include "Features/Minigames/Races/RaceParticipant.pwn"
#include "Features/Minigames/Races/RaceScoreboard.pwn"
#include "Features/Minigames/Races/RaceTrack.pwn"
#include "Features/Minigames/Races/RaceTrackLoader.pwn"
#include "Features/Minigames/Races/RaceUserInterface.pwn"

#include "Features/Minigames/Races/RaceController.pwn"

#if Feature::EnableRaceSystem == 1
    #include "Features/Minigames/Races/RaceCommands.pwn"
#endif

/**
 * The minigame controller and the ability to sign up for minigames should be defined after all the
 * other components for the minigames.
 */
#include "Features/Minigames/MinigameController.pwn"
#include "Features/Minigames/MinigameSignup.pwn"
