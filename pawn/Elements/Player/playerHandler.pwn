// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

#define STATUS_NONE         0
#define STATUS_DERBY1       1
#define STATUS_DERBY2       2
#define STATUS_DERBY3       3
#define STATUS_DERBY4       4
#define STATUS_DERBY5       5
#define STATUS_DERBY6       6
#define STATUS_BATFIGHT     7
#define STATUS_CHAINSAW     8
#define STATUS_DILDO        9
#define STATUS_KNOCKOUT     10
#define STATUS_GRENADE      11
#define STATUS_ROCKET       12
#define STATUS_SNIPER       13
#define STATUS_MINIGUN      14
#define STATUS_SHIPTDM      15
#define STATUS_SAWNOFF      16
#define STATUS_WALKWEAPON   17
#define STATUS_RANDOMDM     18
#define STATUS_ISLANDDM     19

// Note: When adding more minigames, you have to edit the loop
// in MinigamesHandler.pwn line: 437 so IsPlayerStatusMinigame properly works.
// And don't forget to add an option to the /minigames menu!
// - Jay


#define STATUS_DELIVERY     26
#define STATUS_CHASE        27

#define CP_TYPE_NONE        0
#define CP_TYPE_PROPERTY    1
#define CP_TYPE_NORMAL      2


enum PlayerInfoEnum {
    playerID,
    playerName [ 32 ],
    playerMoney,
    playerIsHidden,
    Language,
    playerTJailSes,
    fPackages,
    reactionTestWins,
    Float:BackPos [ 3 ],
    PlayerStatus,
    AreaWarnings,
    LastCheckType,
    LastCheckID,
    playerInCheckpoint
};

new PlayerInfo [ MAX_PLAYERS ] [ PlayerInfoEnum ] ;
ClearPlayer ( playerid ) {
    PlayerInfo [ playerid ] [ playerID ]  = -1;
    format ( PlayerInfo [ playerid ] [ playerName ] ,32,"%s","" ) ;
    PlayerInfo [ playerid ] [ playerMoney ]  = 0;
    PlayerInfo [ playerid ] [ AreaWarnings ]  = 0;
    PlayerInfo [ playerid ] [ BackPos ] [ 0 ]  = 0;
    PlayerInfo [ playerid ] [ BackPos ] [ 1 ]  = 0;
    PlayerInfo [ playerid ] [ BackPos ] [ 2 ]  = 0;
    PlayerInfo [ playerid ] [ PlayerStatus ]  = STATUS_NONE;
    PlayerInfo [ playerid ] [ fPackages ] = 0;
    PlayerInfo [ playerid ] [ reactionTestWins ] = 0;
}