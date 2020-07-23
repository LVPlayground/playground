// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Native functions associated with SAMPCAC. Only proxies through to calling them. Can be replaced
// by MockSAMPCACNatives for testing purposes.
export class SAMPCACNatives {
    // Cheats that can be detected by SAMPCAC.
    static kCheatAimbot = 0;
    static kCheatAimbotAlternative = 1;
    static kCheatAimbotAlternative2 = 11;
    static kCheatAimbotAlternative3 = 12;
    static kCheatAimbotAlternative4 = 14;
    static kCheatAimbotAlternative5 = 15;
    static kCheatTriggerbot = 2;
    static kCheatTriggerbotAlternative = 3;
    static kCheatAdditionalVisibility = 5;  // ESP
    static kCheatAdditionalVisibilityNameTags = 4;  // ESP
    static kCheatMacro = 6;
    static kCheatFakePing = 7;
    static kCheatWeaponDataModified = 8;
    static kCheatNoRecoil = 9;
    static kCheatNoRecoilAlternative = 10;
    static kCheatNoRecoilAlternative2 = 16;
    static kCheatCleo = 13;
    static kCheatUntrustedLibrary = 17;
    static kCheatUntrustedLibraryAlternative = 18;
    static kCheatUntrustedLibraryAlternative2 = 19;
    static kCheatUntrustedLibraryAlternative3 = 20;
    static kCheatAny = 21;

    // Game options that can be controlled with SAMPCAC.
    static kGameOptionVehicleBlips = 0;
    static kGameOptionManualReloading = 1;
    static kGameOptionDriveOnWater = 2;
    static kGameOptionFireproof = 3;
    static kGameOptionSprint = 4;
    static kGameOptionInfiniteSprint = 5;
    static kGameOptionInfiniteOxygen = 6;
    static kGameOptionInfiniteAmmo = 7;
    static kGameOptionNightVision = 8;
    static kGameOptionThermalVision = 9;

    // Options that can be passed to the kGameOptionSprint value.
    static kSprintDefault = 0;
    static kSprintAllSurfaces = 1;
    static kSprintDisabled = 2;

    // Glitches that can be toggled with SAMPCAC.
    static kGlitchQuickReload = 0;
    static kGlitchFastFire = 1;
    static kGlitchFastMove = 2;
    static kGlitchCrouchBug = 3;
    static kGlitchFastSprint = 4;
    static kGlitchQuickStand = 5;

    // Reasons why a player might get kicked by SAMPCAC.
    static kKickReasonConnectionIssue = 0;
    static kKickReasonIncompatibleVersion = 1;

    // Model type flags, can be combined by OR'ing together.
    static kModelTypePeds = 0x01;
    static kModelTypeVehicles = 0x02;
    static kModelTypeWeapons = 0x04;
    static kModelTypeOthers = 0x08;
    static kModelTypePedIfp = 0x10;

    // What should be reported when checking game resource integrity.
    static kReportTypeDisabled = 0;
    static kReportTypeModdedOnly = 1;
    static kReportTypeAll = 2;

    // Resource types which can be checked for game resource integrity.
    static kResourceTypeDff = 0;
    static kResourceTypeTxd = 1;
    static kResourceTypeAnim = 2;

    // Returns whether SAMPCAC is enabled for the given |player|.
    getStatus(player) { return !!pawnInvoke('CAC_GetStatus', 'i', player.id); }

    // Returns the |player|'s SAMPCAC version as [ major, minor, patch ].
    getClientVersion(player) { return pawnInvoke('CAC_GetClientVersion', 'iIII', player.id); }

    // Returns the server's SAMPCAC version as [ major, minor, patch ].
    getServerVersion() { return pawnInvoke('CAC_GetServerVersion', 'III'); }

    // Returns the hardware ID assigned to the given |player|. The hardware ID is based on VMProtect
    // and includes the CPU, HDD, hostname and network: https://helloacm.com/decode-hardware-id/
    getHardwareID(player) { return pawnInvoke('CAC_GetHardwareID', 'iS', player.id); }

    // Reads |size| bytes of memory at the given |address| in |player|'s memory, in the GTA_SA.exe
    // address space. The |size| is limited to four bytes. Returns whether the read was initiated.
    readMemory(player, address, size) {
        return !!pawnInvoke('CAC_ReadMemory', 'iii', player.id, address, size);
    }

    // Reads |size| bytes of memory at the given |address| in |player|'s memory, in the GTA_SA.exe
    // address space, with the result being a checksum. Returns whether the read was initiated.
    readMemoryChecksum(player, address, size, type) {
        return !!pawnInvoke('CAC_ReadMemoryChecksum', 'iiiii', player.id, type, address, 0, size);
    }

    // Enables the |glitch| when |enabled| is set, otherwise disables it.
    setGlitchStatus(glitch, status) {
        pawnInvoke('CAC_SetGlitchStatus', 'ii', glitch, status ? 1 : 0);
    }

    // Enables the |glitch| for |player| when |enabled| is set, otherwise disables it.
    setGlitchStatusForPlayer(player, glitch, status) {
        pawnInvoke('CAC_PlayerSetGlitchSettings', 'iii', player.id, glitch, status ? 1 : 0);
    }

    // Returns whether the given |glitch| is enabled.
    getGlitchStatus(glitch) { return !!pawnInvoke('CAC_GetGlitchStatus', 'i', glitch); }

    // Enables the given |option| when |enabled| is set, otherwise disables it.
    setGameOption(option, enabled) {
        pawnInvoke('CAC_SetGameOptionStatus', 'ii', option, enabled ? 1 : 0);
    }

    // Enables the given |option| for |player| when |enabled| is set, otherwise disables it.
    setGameOptionForPlayer(player, option, enabled) {
        pawnInvoke('CAC_PlayerSetGameOption', 'iii', player.id, option, enabled ? 1 : 0);
    }

    // Returns whether the given |option| is enabled.
    getGameOption(option) { return pawnInvoke('CAC_GetGameOptionStatus', 'i', option); }

    // Sets the reporting status for the given |modelType|, one of the constants.
    setGameResourceReportStatus(modelType, status) {
        pawnInvoke('CAC_SetGameResourceReportStatus', 'ii', modelType, status);
    }

    // Returns the reporting status for the given |modelType|, one of the constants.
    getGameResourceReportStatus(modelType) {
        return pawnInvoke('CAC_GetGameResourceReportStatus', 'i', modelType);
    }

    // Sets how game resource integrity checks should be reported, if at all.
    setGameResourceReportType(reportType) {
        pawnInvoke('CAC_SetGameResourceReportType', 'i', reportType);
    }

    // Returns how game resource integrity is being reported.
    getGameResourceReportType() {
        return pawnInvoke('CAC_GetGameResourceReportType');
    }

    // Sets how game resource integrity will be reported (|reportType|) for the given |player|,
    // specialized for the given |modelType|.
    setGameResourceReportTypeForPlayer(player, modelType, reportType) {
        pawnInvoke('CAC_PlayerSetGameResource', 'iii', player.id, modelType, reportType);
    }
}
