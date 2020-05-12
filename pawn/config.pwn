// Copyright 2006-2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * The version number of the current Las Venturas Playground mode. There is no mechanism for
 * incrementing this version. Significant changes justify a new Major release, use your gut feel.
 */
class Version {
    public const Major = 44;
    public const Minor = 0;
};

// Set this to 1 if you'd like to build Las Venturas Playground in release mode. This affects
// whether config-release.pwn tries to define the prod password salt.
#define BuildGamemodeInReleaseMode 0

// Try to include the private release configuration file. If it can't be loaded, the staging server
// value for the password salt will be used instead.
#tryinclude "config-release.pwn"

#if !defined PasswordSalt
    #define PasswordSalt        "^&lvp__@"
#endif

// Toggling the availability of certain features should be done by changing their values in this
// class. Please follow existing conventions and add features based on their alphabetical order.
class Feature {
    /** **************************************************************************************** **/
    /// Moving stuff to JavaScript defines.

    // Disables the Pawn of everything related to DM fights.
    public const DisableFights = 0;

    /** **************************************************************************************** **/
    /// Christmas

    // A present is dropped somewhere in Las Venturas; when a player picks it up, he receives a 
    // random gift.
    public const EnableGiftHunting = 0;

    /** **************************************************************************************** **/
};
