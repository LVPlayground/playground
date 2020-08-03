// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Encapsulates the results of a SAMPCAC detection run. Self-contained to enable other parts of the
// code to rely on this functionality without concern.
export class DetectorResults {
    static kResultUnavailable = 0;     // results could not be obtained from the player
    static kResultUndeterminable = 1;  // results could not be interpreted against the detector
    static kResultClean = 2;           // results came back negative
    static kResultDetected = 3;        // results came back positive

    // ---------------------------------------------------------------------------------------------
    // Section: Meta-information about the player
    // ---------------------------------------------------------------------------------------------

    // The player for whom this scan was started.
    player = null;

    // Version of the SA-MP client that they're using.
    version = null;

    // Version of the SAMPCAC client that they're using. May be NULL.
    sampcacVersion = null;

    // Hardware ID assigned to the player by SAMPCAC. Based on the VMProtect Hardware ID algorithm,
    // and is thus easily gameable. (https://helloacm.com/decode-hardware-id/)
    sampcacHardwareId = null;

    // Boolean indicating whether the player is currently minimized. This influences whether results
    // will be made available, as their client has to respond to it.
    minimized = null;

    // Boolean indicated whether it was possible to run a scan on the player. This is the case when
    // they have SAMPCAC installed, and responses were returned.
    supported = null;

    // The uptime of the player's computer, in seconds.
    uptime = null;

    // ---------------------------------------------------------------------------------------------
    // Section: Detectors
    // ---------------------------------------------------------------------------------------------

    // Map of <detector name, detector result> for each of the defined detectors. Is not guaranteed
    // to have entries, as the detectors are not open sourced. In effectively randomized order.
    detectors = null;
}
