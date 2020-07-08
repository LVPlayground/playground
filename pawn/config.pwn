// Copyright 2006-2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * The version number of the current Las Venturas Playground mode. There is no mechanism for
 * incrementing this version. Significant changes justify a new Major release, use your gut feel.
 */
class Version {
    public const Major = 50;
    public const Minor = 1;
};

// Set this to 1 if you'd like to build Las Venturas Playground in release mode. This affects
// whether config-release.pwn tries to define the prod password salt.
#define BuildGamemodeInReleaseMode 0

// Toggling the availability of certain features should be done by changing their values in this
// class. Please follow existing conventions and add features based on their alphabetical order.
class Feature {
    /** **************************************************************************************** **/
    /// Moving stuff to JavaScript defines.

    // Disables the Pawn of everything related to DM fights.
    public const DisableFights = 0;

    /** **************************************************************************************** **/

    // A present is dropped somewhere in San Andreas. Finding it will present the player with a gift
    public const EnableGiftHunting = 0;

    // Controls whether server-side weapon configuration will be enabled. This uses Oscar Broman's
    // weapon-config.inc script, with options specific to Las Venturas Playground:
    //
    // https://github.com/oscar-broman/samp-weapon-config
    //
    public const EnableServerSideWeaponConfig = 0;

    /** **************************************************************************************** **/
};
