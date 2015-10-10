// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

// Ammunation shops, scattered around the whole San Andreas region, provide each player with all 
// kind of weapons, including spawn-weapons. Just what they need to roam on our streets!
#include "Features/Deathmatch/Ammunation/AmmunationManager.pwn"
#include "Features/Deathmatch/Ammunation/AmmunationWeapon.pwn"
#include "Features/Deathmatch/Ammunation/AmmunationGuard.pwn"
#include "Features/Deathmatch/Ammunation/AmmunationDialog.pwn"
#include "Features/Deathmatch/Ammunation/Ammunation.pwn"

// Without weapons, GTA wouldn't be GTA. We need to handle spawnweapons and such properly.
#include "Features/Deathmatch/Weapons/SpawnWeaponManager.pwn"
#include "Features/Deathmatch/Weapons/SpawnWeaponCommands.pwn"

// On player death weapons and cash objects are dropped, to be picked up by any other player.
#include "Features/Deathmatch/DropWeaponsCashHandler.pwn"

// In order for some tasty roaming around the server, several commands are needed.
#if Feature::EnableDeathmatchCommands == 1
    #include "Features/Deathmatch/DeathmatchCommands.pwn"
#endif

// The Hitman system gives players the opportunity to place a bounty on other players' heads,
// so they can earn money by bounty-hunting.
#include "Features/Deathmatch/Hitman/HitmanTracker.pwn"
#include "Features/Deathmatch/Hitman/HitmanCommands.pwn"

// Various statues scattered around the Las Venturas Playground gives players certain bonuses on
// successful killing.
#include "Features/Deathmatch/StatuesManager.pwn"

// Players can set a deathmessage which will be shown to each player they kill.
#include "Features/Deathmatch/DeathMessageManager.pwn"

// A seperate environment for players to have fair fights: the FightClub.
#define MAX_FC_MATCHES 30

#if Feature::EnableFightClub == 1
    #include "Features/Deathmatch/FightClub/FightClubManager.pwn"
    #include "Features/Deathmatch/FightClub/FightClubInvitationManager.pwn"
    #include "Features/Deathmatch/FightClub/FightClubSpectateHandler.pwn"
    #include "Features/Deathmatch/FightClub/FightClubArenas.pwn"
    #include "Features/Deathmatch/FightClub/FightClubCommands.pwn"
    #include "Features/Deathmatch/FightClub/FightClubScoreBoard.pwn"
#endif
