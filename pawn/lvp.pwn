// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * List of primary authors:
 *
 *     Russell Krupke         -   Lead Developer.
 *     Manuele "Kase" Macchia -   Lead Developer.
 *     Peter Beverloo         -   Former lead developer, founder.
 *     James "Jay" Wilkinson  -   Former lead developer.
 *     Tomos "tomozj" Jenkins -   Former developer.
 *     Matthias Van Eeghem    -   Former developer.
 *     Daniel "thiaZ" Koenen  -   Former developer.
 *
 * Acknowledgements:
 *
 *     Badeend, Wesley, Fireburn, Chillosophy, Pugwipe, Sander, TransporterX, xBlueXFoxx, iou,
 *     Holden, BRKHN, LasTRace, LilBoy, Darius, Fuse, Holden, Plugy, Tpimp, BLoODsT3R_,
 *     Cyrix404, Gibbs, Halo, Hitman, Lithirm, MacSto, nielz, Pedro, Rien, Sadik, ZheMafo
 *     Cake, Sophia, Biesmen, Harry, Xanland, Holsje, Joeri, striker
 *
 * https://www.sa-mp.nl/
 */

// The minimum pre-compiler version for this Las Venturas Playground build is 5.4.3.
#if !defined __VERSION__ || __VERSION__ < 0x543
  #error "Please update your LVP PreCompiler version to v5.4.3 or later."
#endif

#pragma project "Las Venturas Playground"
#pragma documentation 1

// Initialize the settings and debugging the compiler should implement. See CompilerDebug.pwn in the
// Interface folder for more information on the available debug options.
#compiler map("lvp.ppd")

//#compiler debug(InvocationListCalls)
//#compiler debug(InvocationSwitchCalls)
//#compiler debug(PublicFunctionCalls)
#compiler debug(PawnCompiler)

// Enable or disable debug mode within the LVP PreCompiler?
#pragma debug 2

// The maximum number of players that will be able to join the server.
#define LVP_MAX_PLAYERS 208

// Include the configuration file of Las Venturas Playground, together with the release file which
// defines features that may not be enabled for local beta-server builds.
#include "config.pwn"
#include "release.pwn"

// Include native function declarations and libraries, which don't contain modifications by us.
#include "Interface/Server.pwn"

// Start off by including the Framework classes which provide important functionality for the entire
// gamemode. Then include other backend systems which may be required for other features.
#include "Framework/Annotations.pwn"
#include "Framework/Tests.pwn"

// Interface features without dependencies.
#include "Interface/Cell.pwn"
#include "Interface/Color.pwn"
#include "Interface/Command.pwn"
#include "Interface/CompilerDebug.pwn"
#include "Interface/Dialog.pwn"
#include "Interface/Economy.pwn"
#include "Interface/Enumerations.pwn"
#include "Interface/Instrumentation.pwn"
#include "Interface/Math.pwn"
#include "Interface/JSON.pwn"
#include "Interface/MySQL.pwn"
#include "Interface/Time.pwn"
#include "Interface/ZoneLayer.pwn"
#include "Interface/ZoneManager.pwn"

// Entity classes without dependencies.
#include "Entities/Players.pwn"
#include "Entities/Vehicles.pwn"
#include "Entities/Weapons.pwn"
#include "Entities/World.pwn"

// Entity classes with dependencies.
#include "Entities/NPCs.pwn"
#include "Entities/Pickups.pwn"
#include "Entities/Financial.pwn"
#include "Entities/Properties.pwn"

// Interface features with dependencies.
#include "Interface/Data.pwn"
#include "Interface/TimerController.pwn"
#include "Interface/defines.pwn"

// Now include the individual files which control the actual features. These are grouped by purpose,
// each file of which includes additional files as they see fit.
#include "Features/Account.pwn"
#include "Features/Christmas.pwn"
#include "Features/Communication/SpamTracker.pwn"
#include "Features/Deathmatch.pwn"
#include "Features/Environment.pwn"
#include "Features/External.pwn"
#include "Features/Gameplay.pwn"
#include "Features/Minigames/MinigameType.pwn"
#include "Features/Visual.pwn"
#include "Features/Debug.pwn"

/* *********************************************************************************************** */

#pragma dynamic                         18000       // fix stack warnings
#pragma tabsize                         0           // Defines the tabsize to supress loose indention warnings.

#include Interface/main/LVP.pwn
#include Interface/vars.pwn

// This must have priority since player box display is used a LOT
#include Elements/Player/PlayerDisplay.pwn

// Spawn pos
#include Elements/Player/SpawnPos.pwn

// Player / Map elements
#include Elements/Player/playerHandler.pwn
#include Resources/Maps/MapZones/Handler.pwn

// Virtual world handler - High priority, don't touch order. Requires some vehicle functions
#include Elements/Player/World.pwn

// Order is important here! Import handler requires GTA
#include Resources/Games/Grand_Theft_Auto.pwn

// MiniGames:
#include Resources/Minigames/Core/main.pwn

// Area handler - Order is important!
#include Elements/Player/areaHandler.pwn

// Player handlers
#include Elements/Player/Taxi.pwn
#include Elements/Player/CarCrusher.pwn
#include Elements/Player/BombShop.pwn
#include Elements/Player/Drink.pwn
#include Elements/Player/interiorHandler.pwn
#include Elements/Player/Ramping.pwn
#include Elements/Player/Balloon.pwn
#include Elements/Player/Tow.pwn

// LVP RADIO
#include Elements/Player/LVPRadio.pwn

#include Elements/Player/WantedLevel.pwn
#include Elements/Player/SprayTags.pwn

// Player connections
#include Elements/Player/Connections/SaveInfo.pwn
#include Elements/Player/Connections/connect.pwn
#include Elements/Player/Connections/disconnect.pwn

// Other Games:
#include Resources/Games/Bonuses.pwn
#include Resources/Games/Reaction.pwn
#include Resources/Games/Achievements.pwn
#include Resources/Games/Chase.pwn
#if Feature::DisableKilltime == 0
    #include Resources/Games/Killtime.pwn
#endif
#include Resources/Games/Export.pwn
#include Resources/Games/Bag_of_Cash.pwn

// Fightclub
#if Feature::DisableFightClub == 0
    #include Resources/Games/FightClub.pwn
#endif

// Anticheat
// ---------------------------------------
// The anticheat system is currently being rewritten.

// TODO: Obsolete functionality in these files:
#include Elements/Player/Anticheat/weaponCheat.pwn
#include Elements/Player/Anticheat/teleportCheat.pwn

// ---------------------------------------

// Commands in lvp_command format, Callbacks, and IR
#include Elements/AdministratorCommands.pwn
#include Elements/Player/Commands/Regular.pwn
#include Elements/Player/Commands/General.pwn

#include Resources/IRC/irccommand.pwn


// --------------------
// New account system: LegacyAccountBridge.
// Statistics handler.
// Remove this ASAP.
// --------------------
#include Features/Account/LegacyAccountBridge.pwn
#include Features/Gameplay/Statistics.pwn
#include Features/Visual/PlayerStatisticsInterface.pwn

// --------------------


// Put these down at the end of the includes because everything prior to these should cover everything required IN these
// Note, their order IS important (functions requires areaHandler, specifically)
#include Interface/timers.pwn
#include Elements/Player/zoneHandler.pwn

#include Interface/functions.pwn

// Resources.
#include Resources/Callbacks/OnPlayer/OnPlayerDeath.pwn
#include Resources/Callbacks/OnPlayer/OnPlayerCommandText.pwn
#include Resources/Callbacks/OnPlayer/OnPlayerSpawn.pwn
#include Resources/Callbacks/OnPlayer/OnPlayerStreamIn.pwn
#include Resources/Callbacks/OnPlayer/OnPlayerStreamOut.pwn
#include Resources/Callbacks/OnPlayer/OnPlayerSelectedMenuRow.pwn
#include Resources/Callbacks/OnPlayer/OnPlayerExitedMenu.pwn
#include Resources/Callbacks/OnPlayer/OnPlayerEnterCheckpoint.pwn
#include Resources/Callbacks/OnPlayer/OnPlayerLeaveCheckpoint.pwn
#include Resources/Callbacks/OnPlayer/OnPlayerEnterDynamicRaceCheckpoint.pwn
#include Resources/Callbacks/OnPlayer/OnPlayerEnterRaceCheckpoint.pwn
#include Resources/Callbacks/OnPlayer/OnPlayerKeyStateChange.pwn
#include Resources/Callbacks/OnPlayer/OnPlayerText.pwn
#include Resources/Callbacks/OnPlayer/OnPlayerStateChange.pwn
#include Resources/Callbacks/OnPlayer/OnPlayerInteriorChange.pwn
#include Resources/Callbacks/Others/OnGameModeInit.pwn
#include Resources/Callbacks/Others/OnRconLoginAttempt.pwn
#include Resources/Callbacks/Others/OnDynamicObjectMoved.pwn
#include Resources/Callbacks/Others/OnDialogResponse.pwn

// TODO: Remove me once all pickups have been converted to the new pickup system.
#include "Entities/Pickups/LegacyProcessing.pwn"

#include "Interface/JavaScriptBridge.pwn"

main() {
    /// @todo Move these calls elsewhere. We do need them, though :/
    CompilerDebug->beforePublicFunction('m', 'a', 'i', 'n');
    CompilerDebug->afterPublicFunction();

    if (TestManager->failedTestCount() > 0) {
        printf("The gamemode cannot start with failing tests. Please fix these");
        printf("or find the people responsible for the breakages.");
        SendRconCommand("exit");
    }

    printf("\n");
    printf("|------------------------------------------------------------------------|");
    printf("|      LAS VENTURAS PLAYGROUND - version %d.%d.%d - revision %d      |",
        Version::Major, Version::Minor, __BUILD__, __REVISION__);
    printf("|------------------------------------------------------------------------|");
    printf("\n");

    // Mark the main() method as having finished executing. Because all the constructors and the
    // test suites are being executed as part of it, it can take a non-trivial amount of time. When
    // the OnGameModeInit() method then starts executing we need to be sure this is finished.
    g_mainFinishedExecuting = true;
}
