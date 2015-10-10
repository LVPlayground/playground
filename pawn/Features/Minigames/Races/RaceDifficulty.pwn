// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Not every race is equally hard, some may be easy to finish while others are virtually impossible
 * to complete without dying at least a few times. We've got a number of enumerations to indicate
 * the difficulty of a game, so we can communicate this to the player.
 */
enum RaceDifficulty {
    // Easy games, which almost everyone can complete. Value "easy" in the database.
    EasyRaceDifficulty,

    // Normal difficulty, which can have a few challenging parts in them. Value "normal" in the db.
    NormalRaceDifficulty,

    // Hard races. These can be tricky, have exploding barrels in them, or may rely on flexibility
    // from the player to complete. Value "hard" in the database.
    HardRaceDifficulty
};
