// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Observer for SAMPCAC-related events issued as deferred events. Only the Player instance will be
// validated, other arguments will be passed-through as-is.
export class SAMPCACEventObserver {
    // Called when the |player| has been detected to use the given |cheatId|. Additional information
    // and specifics could be found in |option1| and |option2|.
    onPlayerCheatDetected(player, cheatId, option1, option2) {}

    // Called when the |modelId| for the |player| has been modified. The |checksum| identifies what
    // the actual value is, in case we might want to whitelist it.
    onPlayerGameResourceMismatch(player, modelId, componentType, checksum) {}

    // Called when the |player| has been kicked for the given |reason|.
    onPlayerKicked(player, reason) {}

    // Called when the given |checksum| has been calculated for the |player| at the given memory
    // |address|, which has to be in the GTA_SA.exe memory space. The checksum is an 8-bit integer.
    onPlayerMemoryChecksum(player, address, checksum) {}

    // Called when the memory at the given |address| has been read in their GTA_SA.exe memory space,
    // with the actual memory contents being written to |buffer| as an Uint8Buffer.
    onPlayerMemoryRead(player, address, buffer) {}

    // Called when the |player| has taken a screenshot.
    onPlayerScreenshotTaken(player) {}
}
