// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * The Release Settings are different based on whether we're running a beta version of Las Venturas
 * Playground, or whether we're actually running The Real Deal(tm). Differences can be found in,
 * for example, the employment of non-player characters for services.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class ReleaseSettings {
#if BuildGamemodeInReleaseMode == 1
    // ---------------------------------------------------------------------------------------------
    // Settings for release builds.
    // ---------------------------------------------------------------------------------------------

    // Should the Train Driver service be started, which employs three NPCs?
    public const CreateTrainDrivers = 1;

    // Should the Plane Pilot service be started, which employs three NPCs?
    public const CreatePlanePilots = 1;

    // Should Gunther, our ship hero, be created to watch bad players? He's an employed NPC.
    public const CreateGunther = 1;

    // Should the GTA Merchant system be enabled, which uses a single NPC?
    public const CreateMerchant = 1;

    // Enable commands which should only be available on the beta server?
    public const EnableBetaCommands = 0;

#else
    // ---------------------------------------------------------------------------------------------
    // Settings for beta-testing builds.
    // ---------------------------------------------------------------------------------------------

    // Should the Train Driver service be started, which employs three NPCs?
    public const CreateTrainDrivers = 0;

    // Should the Plane Pilot service be started, which employs three NPCs?
    public const CreatePlanePilots = 0;

    // Should Gunther, our ship hero, be created to watch bad players? He's an employed NPC.
    public const CreateGunther = 1;

    // Should the GTA Merchant system be enabled, which uses a single NPC?
    public const CreateMerchant = 0;

    // Enable commands which should only be available on the beta server?
    public const EnableBetaCommands = 1;

#endif
};
