// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * There are four levels which a player can have. A player can be a Management member, an admin,
 * a moderator or a regular player. Besides the actual levels, players can be a VIP member or a
 * developer regardless of what their player level is.
 */
enum PlayerAccessLevel {
    PlayerLevel,
    ModeratorLevel,
    AdministratorLevel,
    ManagementLevel
};

/**
 * The following flags are available for each of the players, and can be set individually. They
 * represent part of the player's state, and are important for the gamemode to know what to do. None
 * of the flags should be directly related to a player's Account, except whether they're registered.
 */
enum PlayerFlags {
    // Is the player connected to Las Venturas Playground?
    IsConnectedPlayerFlag,

    // Used to identify Non Player Characters (NPCs).
    IsNonPlayerCharacterFlag,

    // Has an account been found that is associated with the player's nickname?
    IsRegisteredFlag,

    // Has the player logged in to said account?
    IsLoggedInFlag,

    // Is this player a Las Venturas Playground developer?
    IsDeveloperFlag,

    // Did this player donate to Las Venturas Playground?
    IsVeryImportantPlayer,

    // Is this player currently viewing the class selection phase?
    InClassSelectionFlag
};
